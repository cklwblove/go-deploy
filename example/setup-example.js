#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 设置测试环境
 * 创建测试文件和目录
 */
function setupTestEnvironment() {
  console.log('🚀 设置 go-deploy 测试环境\n');

  // 创建测试文件目录
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log('✓ 创建测试目录:', testDir);
  }

  // 创建测试文件
  const testFiles = [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
    <title>Go-Deploy 测试</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Go-Deploy 部署测试</h1>
    <p>这是一个测试文件，用于验证 go-deploy 的部署功能。</p>
    <p>部署时间: ${new Date().toLocaleString()}</p>
</body>
</html>`
    },
    {
      name: 'app.js',
      content: `// Go-Deploy 测试应用
console.log('Go-Deploy 测试应用启动');
console.log('部署时间:', new Date().toISOString());

// 模拟应用逻辑
function testFunction() {
    return 'Hello from Go-Deploy test!';
}

module.exports = { testFunction };`
    },
    {
      name: 'style.css',
      content: `/* Go-Deploy 测试样式 */
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}

p {
    line-height: 1.6;
    color: #666;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`
    },
    {
      name: 'config.json',
      content: JSON.stringify({
        name: 'go-deploy-test-app',
        version: '1.0.0',
        description: '用于测试 go-deploy 的示例应用',
        environment: 'test'
      }, null, 2)
    },
    {
      name: 'README.md',
      content: `# Go-Deploy 测试文件

这些文件用于测试 go-deploy 的部署功能。

## 文件说明

- \`index.html\`: 主页面
- \`app.js\`: JavaScript 应用代码
- \`style.css\`: 样式文件
- \`config.json\`: 配置文件
- \`README.md\`: 说明文件

## 部署说明

这些文件将被部署到远程服务器的指定目录中。
`
    }
  ];

  // 创建测试文件
  testFiles.forEach(file => {
    const filePath = path.join(testDir, file.name);
    fs.writeFileSync(filePath, file.content);
    console.log('✓ 创建测试文件:', file.name);
  });

  // 创建子目录和文件
  const subDir = path.join(testDir, 'assets');
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir);
    console.log('✓ 创建子目录: assets');
  }

  fs.writeFileSync(path.join(subDir, 'logo.txt'), '这是一个模拟的 logo 文件');
  console.log('✓ 创建子文件: assets/logo.txt');

  // 创建应该被排除的文件
  fs.writeFileSync(path.join(testDir, 'test.log'), '这是一个日志文件，应该被排除');
  fs.writeFileSync(path.join(testDir, 'temp.tmp'), '这是一个临时文件，应该被排除');
  console.log('✓ 创建测试排除文件');

  console.log('\n🎉 测试环境设置完成！');
  console.log('\n📁 测试文件目录:', testDir);
  console.log('📋 测试文件列表:');

  function listFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        listFiles(itemPath, prefix + '  ');
      } else {
        console.log(`${prefix}📄 ${item}`);
      }
    });
  }

  listFiles(testDir, '  ');

  console.log('\n📝 下一步:');
  console.log('1. 修改 config.json 中的服务器连接信息');
  console.log('2. 运行 npm run test 进行测试');
  console.log('3. 或者运行 npm run deploy 进行实际部署');
}

// 运行设置
setupTestEnvironment();
