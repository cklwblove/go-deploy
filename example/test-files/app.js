// Go-Deploy 测试应用
console.log('Go-Deploy 测试应用启动');
console.log('部署时间:', new Date().toISOString());

// 模拟应用逻辑
function testFunction() {
    return 'Hello from Go-Deploy test!';
}

module.exports = { testFunction };