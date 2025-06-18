#!/usr/bin/env node

const { deploy } = require('../lib/index.js');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--config' && i + 1 < args.length) {
    options.config = args[i + 1];
    i++; // 跳过下一个参数
  } else if (arg === '--help') {
    options.help = true;
  } else if (arg === '--version') {
    options.version = true;
  }
}

// 执行部署
deploy(options)
  .then((result) => {
    if (result && result.stdout) {
      console.log(result.stdout);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('错误:', error.message);
    process.exit(1);
  });
