package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

// 配置文件结构体
type Config struct {
	Server struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
		Timeout  int    `json:"timeout"`
	} `json:"server"`
	Paths struct {
		Local  string `json:"local"`
		Remote string `json:"remote"`
	} `json:"paths"`
	Options struct {
		Backup          bool     `json:"backup"`
		BackupSuffix    string   `json:"backup_suffix"`
		ExcludePatterns []string `json:"exclude_patterns"`
		MaxRetries      int      `json:"max_retries"`
		ChunkSize       int      `json:"chunk_size"`
	} `json:"options"`
}

// 全局统计变量
var (
	fileCount int64 // 文件数量
	totalSize int64 // 总传输大小
	dirCount  int64 // 目录数量
)

// 读取配置文件
func loadConfig(configPath string) (*Config, error) {
	// 检查配置文件是否存在
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("配置文件 %s 不存在", configPath)
	}

	// 读取配置文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}

	// 解析JSON
	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %v", err)
	}

	return &config, nil
}

// 检查文件是否应该被排除
func shouldExcludeFile(filename string, excludePatterns []string) bool {
	for _, pattern := range excludePatterns {
		// 简单的通配符匹配
		if matched, _ := filepath.Match(pattern, filepath.Base(filename)); matched {
			return true
		}
		// 检查文件名是否包含模式
		if strings.Contains(filepath.Base(filename), strings.Trim(pattern, "*")) {
			return true
		}
	}
	return false
}

// 创建备份文件
func createBackup(client *sftp.Client, remotePath, backupSuffix string) error {
	// 检查远程文件是否存在
	if _, err := client.Stat(remotePath); err != nil {
		// 文件不存在，无需备份
		return nil
	}

	backupPath := remotePath + backupSuffix
	fmt.Printf("创建备份: %s -> %s\n", remotePath, backupPath)

	// 打开原文件
	srcFile, err := client.Open(remotePath)
	if err != nil {
		return fmt.Errorf("打开原文件失败: %v", err)
	}
	defer srcFile.Close()

	// 创建备份文件
	dstFile, err := client.Create(backupPath)
	if err != nil {
		return fmt.Errorf("创建备份文件失败: %v", err)
	}
	defer dstFile.Close()

	// 复制文件内容
	_, err = io.Copy(dstFile, srcFile)
	if err != nil {
		return fmt.Errorf("复制备份文件失败: %v", err)
	}

	return nil
}

// 带重试的文件上传
func uploadFileWithRetry(client *sftp.Client, localPath, remotePath string, maxRetries int, backup bool, backupSuffix string) error {
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		if attempt > 1 {
			fmt.Printf("重试上传文件 (%d/%d): %s\n", attempt, maxRetries, localPath)
			time.Sleep(time.Duration(attempt) * time.Second) // 递增延迟
		}

		// 如果需要备份且是第一次尝试，先创建备份
		if backup && attempt == 1 {
			if err := createBackup(client, remotePath, backupSuffix); err != nil {
				fmt.Printf("警告: 创建备份失败: %v\n", err)
			}
		}

		err := uploadFile(client, localPath, remotePath)
		if err == nil {
			return nil // 上传成功
		}

		lastErr = err
		fmt.Printf("上传失败 (尝试 %d/%d): %v\n", attempt, maxRetries, err)
	}

	return fmt.Errorf("上传失败，已重试 %d 次: %v", maxRetries, lastErr)
}

func main() {
	// 定义命令行参数
	var configPath = flag.String("config", "config.json", "配置文件路径")
	var showHelp = flag.Bool("help", false, "显示帮助信息")
	var showVersion = flag.Bool("version", false, "显示版本信息")

	// 自定义Usage函数
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Go-Deploy 部署工具\n\n")
		fmt.Fprintf(os.Stderr, "用法: %s [选项]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "选项:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\n示例:\n")
		fmt.Fprintf(os.Stderr, "  %s                           # 使用默认配置文件 config.json\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s --config prod.json        # 使用指定配置文件\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s --config /path/to/config.json  # 使用绝对路径配置文件\n", os.Args[0])
	}

	// 解析命令行参数
	flag.Parse()

	// 处理帮助信息
	if *showHelp {
		flag.Usage()
		return
	}

	// 处理版本信息
	if *showVersion {
		fmt.Println("Go-Deploy v1.0.0")
		fmt.Println("一个基于Go语言开发的自动化部署工具")
		return
	}

	fmt.Println("开始执行部署程序...")
	startTime := time.Now() // 记录开始时间

	// 获取当前可执行文件所在目录
	exePath, err := os.Executable()
	if err != nil {
		fmt.Printf("获取可执行文件路径失败: %v\n", err)
		return
	}
	baseDir := filepath.Dir(exePath)

	// 处理配置文件路径
	var finalConfigPath string
	if filepath.IsAbs(*configPath) {
		// 绝对路径直接使用
		finalConfigPath = *configPath
	} else {
		// 相对路径基于可执行文件目录
		finalConfigPath = filepath.Join(baseDir, *configPath)
	}

	fmt.Printf("尝试读取配置文件: %s\n", finalConfigPath)

	// 尝试读取配置文件
	config, err := loadConfig(finalConfigPath)
	if err != nil {
		fmt.Printf("错误: %v\n", err)
		fmt.Println("请提供正确的配置文件或使用 --help 查看帮助信息")
		return
	}

	fmt.Println("使用配置文件...")

	// 使用配置文件
	var localDir string
	if filepath.IsAbs(config.Paths.Local) {
		localDir = config.Paths.Local
	} else {
		localDir = filepath.Join(baseDir, config.Paths.Local)
		localDir, err = filepath.Abs(localDir)
		if err != nil {
			fmt.Printf("获取本地目录绝对路径失败: %v\n", err)
			return
		}
	}

	remoteDir := config.Paths.Remote

	sshConfig := &ssh.ClientConfig{
		User: config.Server.Username,
		Auth: []ssh.AuthMethod{
			ssh.Password(config.Server.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         time.Duration(config.Server.Timeout) * time.Second,
	}

	// 检查本地目录是否存在
	if _, err := os.Stat(localDir); os.IsNotExist(err) {
		fmt.Printf("错误: 本地目录 %s 不存在\n", localDir)
		return
	}
	fmt.Printf("本地目录 %s 存在\n", localDir)

	// 连接SSH服务器
	fmt.Println("正在连接SSH服务器...")
	serverAddr := fmt.Sprintf("%s:%d", config.Server.Host, config.Server.Port)

	sshClient, err := ssh.Dial("tcp", serverAddr, sshConfig)
	if err != nil {
		fmt.Printf("连接SSH服务器失败: %v\n", err)
		return
	}
	defer sshClient.Close()
	fmt.Println("SSH服务器连接成功")

	// 创建SFTP客户端
	fmt.Println("正在创建SFTP客户端...")
	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		fmt.Printf("创建SFTP客户端失败: %v\n", err)
		return
	}
	defer sftpClient.Close()
	fmt.Println("SFTP客户端创建成功")

	fmt.Printf("准备上传到远程目录: %s\n", remoteDir)

	// 上传整个目录
	fmt.Println("开始上传目录...")
	uploadStartTime := time.Now() // 记录上传开始时间
	err = uploadDirectory(sftpClient, localDir, remoteDir, config)
	uploadEndTime := time.Now() // 记录上传结束时间

	if err != nil {
		fmt.Printf("上传失败: %v\n", err)
		return
	}

	endTime := time.Now() // 记录程序结束时间

	// 计算时间
	uploadDuration := uploadEndTime.Sub(uploadStartTime)
	totalDuration := endTime.Sub(startTime)

	// 计算传输速度
	var speed float64
	if uploadDuration.Seconds() > 0 {
		speed = float64(totalSize) / uploadDuration.Seconds() / 1024 / 1024 // MB/s
	}

	fmt.Println("目录上传成功!")
	fmt.Printf("统计信息:\n")
	fmt.Printf("  - 上传文件数: %d\n", fileCount)
	fmt.Printf("  - 创建目录数: %d\n", dirCount)
	fmt.Printf("  - 传输大小: %.2f MB\n", float64(totalSize)/1024/1024)
	fmt.Printf("  - 上传耗时: %v\n", uploadDuration)
	fmt.Printf("  - 总耗时: %v\n", totalDuration)
	if speed > 0 {
		fmt.Printf("  - 传输速度: %.2f MB/s\n", speed)
	}
}

// 上传整个目录
func uploadDirectory(client *sftp.Client, localDir, remoteDir string, config *Config) error {
	fmt.Printf("开始遍历本地目录: %s\n", localDir)

	return filepath.WalkDir(localDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			fmt.Printf("遍历目录时出错: %v\n", err)
			return err
		}

		// 计算相对路径
		relPath, err := filepath.Rel(localDir, path)
		if err != nil {
			fmt.Printf("计算相对路径失败: %v\n", err)
			return err
		}

		// 构建远程路径（使用正斜杠）
		remotePath := filepath.ToSlash(filepath.Join(remoteDir, relPath))

		if d.IsDir() {
			// 创建远程目录
			fmt.Printf("创建目录: %s\n", remotePath)
			atomic.AddInt64(&dirCount, 1)
			return mkdirAll(client, remotePath)
		} else {
			// 检查文件是否应该被排除
			if shouldExcludeFile(relPath, config.Options.ExcludePatterns) {
				fmt.Printf("文件 %s 被排除，跳过上传\n", relPath)
				return nil
			}

			// 上传文件
			fmt.Printf("上传文件: %s -> %s\n", path, remotePath)
			atomic.AddInt64(&fileCount, 1)

			// 获取文件大小
			if info, err := os.Stat(path); err == nil {
				atomic.AddInt64(&totalSize, info.Size())
			}

			// 使用配置中的选项
			maxRetries := config.Options.MaxRetries
			backup := config.Options.Backup
			backupSuffix := config.Options.BackupSuffix

			return uploadFileWithRetry(client, path, remotePath, maxRetries, backup, backupSuffix)
		}
	})
}

// 上传单个文件
func uploadFile(client *sftp.Client, localPath, remotePath string) error {
	// 确保远程目录存在
	remoteDir := filepath.Dir(remotePath)
	if err := mkdirAll(client, remoteDir); err != nil {
		return fmt.Errorf("创建远程目录失败: %v", err)
	}

	// 打开本地文件
	localFile, err := os.Open(localPath)
	if err != nil {
		return fmt.Errorf("打开本地文件失败: %v", err)
	}
	defer localFile.Close()

	// 创建远程文件
	remoteFile, err := client.Create(remotePath)
	if err != nil {
		return fmt.Errorf("创建远程文件失败: %v", err)
	}
	defer remoteFile.Close()

	// 复制文件内容
	_, err = io.Copy(remoteFile, localFile)
	if err != nil {
		return fmt.Errorf("复制文件内容失败: %v", err)
	}

	return nil
}

// 递归创建目录
func mkdirAll(client *sftp.Client, path string) error {
	if path == "" || path == "/" {
		return nil
	}

	// 检查目录是否已存在
	if _, err := client.Stat(path); err == nil {
		return nil // 目录已存在
	}

	// 递归创建父目录
	parent := filepath.Dir(path)
	if parent != path {
		if err := mkdirAll(client, parent); err != nil {
			return err
		}
	}

	// 创建当前目录
	err := client.Mkdir(path)
	if err != nil {
		return fmt.Errorf("创建目录 %s 失败: %v", path, err)
	}

	return nil
}
