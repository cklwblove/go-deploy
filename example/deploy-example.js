#!/usr/bin/env node

const { deploy, getVersion, checkBinary } = require('../lib/index.js');
const path = require('path');
const fs = require('fs');

/**
 * Go-Deploy JavaScript API 使用示例
 * 演示如何在 Node.js 项目中使用 go-deploy
 */
async function demonstrateAPI() {
  console.log('🚀 Go-Deploy JavaScript API 使用示例\n');

  try {
    // 1. 检查二进制文件是否可用
    console.log('📦 1. 检查二进制文件状态');
    const isAvailable = checkBinary();
    console.log(`   二进制文件可用: ${isAvailable ? '✅' : '❌'}`);

    if (!isAvailable) {
      console.error('❌ 二进制文件不可用，请确保正确安装了 @winner-fed/go-deploy');
      console.log('\n💡 解决方案:');
      console.log('   • 运行 npm install @winner-fed/go-deploy');
      console.log('   • 检查是否安装了对应平台的二进制包');
      return;
    }

    // 2. 获取版本信息
    console.log('\n📋 2. 获取版本信息');
    try {
      const version = await getVersion();
      console.log(`   版本: ${version.trim()}`);
    } catch (error) {
      console.error(`   ❌ 获取版本失败: ${error.message}`);
    }

    // 3. 显示帮助信息
    console.log('\n❓ 3. 显示帮助信息');
    try {
      const helpResult = await deploy({
        help: true,
        silent: true
      });
      console.log('   帮助信息:');
      console.log('   ' + helpResult.stdout.split('\n').join('\n   '));
    } catch (error) {
      console.error(`   ❌ 获取帮助信息失败: ${error.message}`);
    }

    // 4. 配置文件示例
    console.log('\n⚙️ 4. 配置文件示例');
    const configPath = path.join(__dirname, 'config.json');
    console.log(`   配置文件路径: ${configPath}`);

    if (fs.existsSync(configPath)) {
      console.log('   ✅ 配置文件存在');
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('   配置文件内容预览:');
        console.log(`   • 服务器: ${config.server.host}:${config.server.port}`);
        console.log(`   • 本地路径: ${config.paths.local}`);
        console.log(`   • 远程路径: ${config.paths.remote}`);
        console.log(`   • 排除模式: ${config.options.exclude_patterns.join(', ')}`);
      } catch (error) {
        console.error(`   ❌ 配置文件解析失败: ${error.message}`);
      }
    } else {
      console.log('   ⚠️ 配置文件不存在，请先运行 npm run setup');
    }

    // 5. 测试文件检查
    console.log('\n📁 5. 测试文件检查');
    const testDir = path.join(__dirname, 'test-files');
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      console.log(`   ✅ 测试目录存在，包含 ${files.length} 个文件`);
      console.log(`   测试文件: ${files.join(', ')}`);
    } else {
      console.log('   ⚠️ 测试目录不存在，请先运行 npm run setup');
    }

    // 6. API 调用示例
    console.log('\n🔧 6. API 调用示例');
    console.log('   以下是常用的 API 调用方式:');

    console.log('\n   // 基本部署');
    console.log('   await deploy({ config: "./config.json" });');

    console.log('\n   // 使用自定义配置');
    console.log('   await deploy({');
    console.log('     config: "./prod.json",');
    console.log('     cwd: process.cwd(),');
    console.log('     silent: false');
    console.log('   });');

    console.log('\n   // 静默模式（获取输出）');
    console.log('   const result = await deploy({');
    console.log('     config: "./config.json",');
    console.log('     silent: true');
    console.log('   });');
    console.log('   console.log(result.stdout);');

    // 7. 实际部署测试提示
    console.log('\n🚀 7. 实际部署测试');
    if (fs.existsSync(configPath) && fs.existsSync(testDir)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      if (config.server.host === '127.0.0.1' && config.server.username === 'testuser') {
        console.log('   ⚠️ 当前使用的是默认测试配置');
        console.log('   要进行实际部署，请:');
        console.log('   • 修改 config.json 中的服务器连接信息');
        console.log('   • 确保服务器可以通过 SSH 连接');
        console.log('   • 确保远程路径存在且有写入权限');
        console.log('   • 然后运行: npm run deploy');
      } else {
        console.log('   ✅ 配置文件已更新，可以尝试实际部署');
        console.log('   运行部署命令: npm run deploy');

        // 询问是否要执行部署
        console.log('\n   ❓ 是否要执行实际部署？（需要确认服务器信息正确）');
        console.log('   取消注释下面的代码来执行部署:');
        console.log('   /*');
        console.log('   await deploy({ config: "./config.json" });');
        console.log('   console.log("🎉 部署完成！");');
        console.log('   */');
      }
    } else {
      console.log('   ❌ 缺少配置文件或测试文件');
      console.log('   请先运行: npm run setup');
    }

    console.log('\n🎯 8. 下一步操作');
    console.log('   • 运行 npm run setup - 创建测试环境');
    console.log('   • 运行 npm run test - 执行功能测试');
    console.log('   • 修改 config.json - 配置实际服务器信息');
    console.log('   • 运行 npm run deploy - 执行实际部署');

  } catch (error) {
    console.error('❌ 示例执行失败:', error.message);
    console.log('\n🔍 故障排除:');
    console.log('1. 确保已正确安装 @winner-fed/go-deploy');
    console.log('2. 检查网络连接');
    console.log('3. 验证配置文件格式');
    console.log('4. 查看详细错误信息');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  demonstrateAPI();
}

module.exports = { demonstrateAPI };
