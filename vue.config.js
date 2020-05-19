module.exports = {
    "transpileDependencies": [
        "vuetify"
    ],
    pages: {
        index: {
            // page 的入口
            entry: 'src/main.js',
            // 模板来源
            template: 'public/index.html',
            // 在 dist/index.html 的输出
            filename: 'popup.html',
            // 当使用 title 选项时，
            // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
            title: 'Weather Forecast',
            // 在这个页面中包含的块，默认情况下会包含
            // 提取出来的通用 chunk 和 vendor chunk。
            chunks: ['chunk-vendors', 'chunk-common', 'index']
        },
        background: {
            entry: 'src/background.js',
            template: 'public/background.html',
            filename: 'background.html',
            title: 'Weather Forecast',
            chunks: ['chunk-vendors', 'chunk-common', 'background']
        }
    },
    publicPath: '',
    outputDir: 'extension/dist',
    productionSourceMap: false
}