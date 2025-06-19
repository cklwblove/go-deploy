#!/usr/bin/env node

const { deploy, getVersion, checkBinary } = require('../lib/index.js');
const path = require('path');
const fs = require('fs');

/**
 * Go-Deploy 测试脚本
 * 提供完整的测试流程和功能验证
 */
class GoDeployTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.configPath = path.join(__dirname, 'config.json');
    this.testDir = path.join(__dirname, 'test-files');
  }

  // 打印测试结果
  log(message, type = 'info') {
    const symbols = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${symbols[type]} ${message}`);
  }

  // 执行测试用例
  async runTest(name, testFn) {
    this.log(`${name}`, 'test');
    try {
      await testFn();
      this.passed++;
      this.log(`${name} - 通过`, 'success');
    } catch (error) {
      this.failed++;
      this.log(`${name} - 失败: ${error.message}`, 'error');
    }
  }

  // 检查前置条件
  async checkPrerequisites() {
    this.log('检查前置条件...', 'info');

    // 检查二进制文件
    const binaryAvailable = checkBinary();
    if (!binaryAvailable) {
      throw new Error('go-deploy 二进制文件不可用');
    }
    this.log('二进制文件可用', 'success');

    // 检查测试文件
    if (!fs.existsSync(this.testDir)) {
      this.log('测试文件不存在，请先运行 npm run setup', 'warning');
      throw new Error('测试文件不存在');
    }
    this.log('测试文件存在', 'success');

    // 检查配置文件
    if (!fs.existsSync(this.configPath)) {
      this.log('配置文件不存在', 'warning');
      throw new Error('配置文件不存在');
    }
    this.log('配置文件存在', 'success');
  }

  // 测试版本获取
  async testVersion() {
    const version = await getVersion();
    if (!version || version.trim() === '') {
      throw new Error('版本信息为空');
    }
    this.log(`版本信息: ${version.trim()}`, 'info');
  }

  // 测试帮助信息
  async testHelp() {
    const result = await deploy({
      help: true,
      silent: true
    });

    if (!result.stdout || !result.stdout.includes('Go-Deploy')) {
      throw new Error('帮助信息不正确');
    }

    // 检查是否使用了简洁的命令名
    if (result.stdout.includes('node_modules') || result.stdout.includes('/Volumes/')) {
      throw new Error('帮助信息仍然显示完整路径');
    }

    this.log('帮助信息正确显示', 'success');
  }

  // 测试配置文件解析
  async testConfigValidation() {
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

    // 检查必需字段
    const requiredFields = ['server', 'paths', 'options'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`配置文件缺少 ${field} 字段`);
      }
    }

    // 检查服务器配置
    const serverFields = ['host', 'port', 'username', 'password'];
    for (const field of serverFields) {
      if (!config.server[field]) {
        throw new Error(`服务器配置缺少 ${field} 字段`);
      }
    }

    this.log('配置文件格式正确', 'success');
  }

  // 测试文件过滤
  async testFileFiltering() {
    const files = fs.readdirSync(this.testDir);
    const logFiles = files.filter(file => file.endsWith('.log'));
    const tmpFiles = files.filter(file => file.endsWith('.tmp'));

    if (logFiles.length === 0) {
      throw new Error('没有找到测试用的 .log 文件');
    }

    if (tmpFiles.length === 0) {
      throw new Error('没有找到测试用的 .tmp 文件');
    }

    this.log(`找到 ${logFiles.length} 个 .log 文件和 ${tmpFiles.length} 个 .tmp 文件`, 'info');
  }

  // 测试连接（不执行实际部署）
  async testConnection() {
    this.log('测试连接功能...', 'info');

    // 读取配置
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

    // 如果是默认测试配置，跳过连接测试
    if (config.server.host === '127.0.0.1' && config.server.username === 'testuser') {
      this.log('跳过连接测试（使用默认测试配置）', 'warning');
      return;
    }

    // 这里可以添加实际的连接测试逻辑
    this.log('连接测试功能待实现', 'warning');
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始 Go-Deploy 功能测试\n');

    try {
      await this.checkPrerequisites();
      console.log();

      await this.runTest('版本信息获取', () => this.testVersion());
      await this.runTest('帮助信息显示', () => this.testHelp());
      await this.runTest('配置文件验证', () => this.testConfigValidation());
      await this.runTest('文件过滤测试', () => this.testFileFiltering());
      await this.runTest('连接测试', () => this.testConnection());

    } catch (error) {
      this.log(`前置条件检查失败: ${error.message}`, 'error');
      return;
    }

    // 显示测试结果
    console.log('\n📊 测试结果:');
    console.log(`✅ 通过: ${this.passed}`);
    console.log(`❌ 失败: ${this.failed}`);
    console.log(`📈 总计: ${this.passed + this.failed}`);

    if (this.failed === 0) {
      console.log('\n🎉 所有测试通过！');
      console.log('💡 现在可以修改配置文件进行实际部署测试');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查上述错误');
      process.exit(1);
    }
  }

  // 显示配置帮助
  showConfigHelp() {
    console.log('\n📋 配置文件说明:');
    console.log('当前配置文件:', this.configPath);
    console.log('\n如需进行实际部署测试，请修改配置文件中的以下信息:');
    console.log('• server.host - 服务器地址');
    console.log('• server.username - 服务器用户名');
    console.log('• server.password - 服务器密码');
    console.log('• paths.remote - 远程部署路径');
    console.log('\n⚠️ 请确保服务器信息正确，避免影响生产环境');
  }
}

// 运行测试
async function main() {
  const tester = new GoDeployTester();

  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Go-Deploy 测试脚本');
    console.log('用法: node test-example.js [选项]');
    console.log('选项:');
    console.log('  --help, -h     显示帮助信息');
    console.log('  --config-help  显示配置帮助');
    return;
  }

  if (args.includes('--config-help')) {
    tester.showConfigHelp();
    return;
  }

  await tester.runAllTests();
  tester.showConfigHelp();
}

main().catch(error => {
  console.error('❌ 测试脚本执行失败:', error.message);
  process.exit(1);
});
