#!/usr/bin/env node

const { spawn } = require('child_process');
const { getBinaryPath } = require('../lib/index.js');

async function main() {
  try {
    const binaryPath = await getBinaryPath();

    // 将所有命令行参数传递给 Go 二进制文件
    const child = spawn(binaryPath, process.argv.slice(2), {
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    child.on('error', (error) => {
      console.error('执行失败:', error.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();
