const { deploy, getVersion, checkBinary } = require('../lib/index.js');
const path = require('path');

async function example() {
  console.log('go-deploy JavaScript API 使用示例\n');

  try {
    // 检查二进制文件是否可用
    console.log('1. 检查二进制文件状态');
    const isAvailable = checkBinary();
    console.log(`二进制文件可用: ${isAvailable}\n`);

    if (!isAvailable) {
      console.error('二进制文件不可用，请确保正确安装了 go-deploy');
      return;
    }

    // 获取版本信息
    console.log('2. 获取版本信息');
    try {
      const version = await getVersion();
      console.log(`版本: ${version}\n`);
    } catch (error) {
      console.error(`获取版本失败: ${error.message}\n`);
    }

    // 显示帮助信息
    console.log('3. 显示帮助信息');
    try {
      const result = await deploy({
        help: true,
        silent: true
      });
      console.log('帮助信息:');
      console.log(result.stdout);
      console.log();
    } catch (error) {
      console.error(`获取帮助信息失败: ${error.message}\n`);
    }

    // 检查配置文件
    console.log('4. 配置文件检查');
    const configPath = path.join(__dirname, 'config.json');
    console.log(`配置文件路径: ${configPath}`);

    // 创建示例配置
    const exampleConfig = {
      server: {
        host: "your-server-ip",
        port: 22,
        username: "your-username",
        password: "your-password",
        timeout: 10
      },
      paths: {
        local: "./dist",
        remote: "/opt/your-app/dist"
      },
      options: {
        backup: true,
        backup_suffix: ".backup",
        exclude_patterns: [
          "*.log",
          "*.map",
          ".DS_Store",
          "node_modules"
        ],
        max_retries: 3,
        chunk_size: 1048576
      }
    };

    console.log('示例配置结构:');
    console.log(JSON.stringify(exampleConfig, null, 2));
    console.log();

    // 注意：实际部署需要真实的配置文件
    console.log('5. 实际部署示例（需要真实配置）');
    console.log('要执行实际部署，请:');
    console.log('- 创建有效的 config.json 文件');
    console.log('- 确保服务器连接信息正确');
    console.log('- 然后调用: await deploy({ config: "./config.json" })');

    /*
    // 取消注释以执行实际部署（需要有效的配置文件）
    if (require('fs').existsSync('./config.json')) {
      console.log('执行部署...');
      await deploy({
        config: './config.json',
        // cwd: process.cwd(),
        // silent: false
      });
      console.log('部署完成！');
    }
    */

  } catch (error) {
    console.error('示例执行失败:', error.message);
  }
}

// 运行示例
example();
