const { ipcRenderer } = require('electron');
const puppeteer = require('puppeteer');

class HTMLPDFExporter {
    constructor() {
        this.browser = null;
    }

    async initializeBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // 生成HTML内容
    generateHTMLContent(questions, settings, includeAnswers = false) {
        const questionsPerRow = parseInt(settings.questionsPerRow);
        
        // 计算每道题的宽度：A4纸宽度 / 题目数量
        // A4纸宽度约210mm，转换为像素约794px（96 DPI）
        const pageWidth = 794;
        const margin = 40; // 左右边距
        const gap = 15; // 题目间距
        const answerSpace = 60; // 答案区域宽度
        const padding = 20; // 题目项内边距
        const availableWidth = pageWidth - margin;
        const questionWidth = Math.floor((availableWidth - (questionsPerRow - 1) * gap) / questionsPerRow);
        const textWidth = questionWidth - answerSpace - padding; // 题目文本实际可用宽度
        
        let html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>数学练习题</title>
            <style>
                body {
                    font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 15px;
                }
                .header h1 {
                    font-size: 24px;
                    margin: 0 0 10px 0;
                    color: #2d3748;
                }
                .header p {
                    font-size: 14px;
                    margin: 0;
                    color: #666;
                }
                .info-fields {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .info-field {
                    display: flex;
                    align-items: center;
                    font-size: 16px;
                    color: #2d3748;
                    font-weight: 500;
                }
                .info-field input {
                    margin-left: 10px;
                    border: none;
                    background: transparent;
                    font-size: 16px;
                    color: #2d3748;
                    font-weight: 500;
                    width: 120px;
                    text-align: left;
                    padding: 2px 5px;
                    outline: none;
                }
                .math-questions {
                    display: grid;
                    gap: 4px;
                }
                .question-row {
                    display: grid;
                    grid-template-columns: repeat(${questionsPerRow}, 1fr);
                    gap: 15px;
                    margin-bottom: 4px;
                    padding: 4px;
                    border: none;
                    background: transparent;
                }
                .question-item {
                    display: flex;
                    align-items: center;
                    padding: 4px;
                    background: transparent;
                    border: none;
                    min-height: 35px;
                }
                .question-text {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2d3748;
                    font-family: 'Courier New', monospace;
                    white-space: nowrap;
                    flex: 1;
                }
                .answer-space {
                    width: 60px;
                    height: 20px;
                    margin-left: 10px;
                }
                .answer-text {
                    font-size: 18px;
                    color: #1e40af;
                    font-weight: 700;
                    font-family: 'Courier New', monospace;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .question-item { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>数学练习题</h1>
                <p>数字范围: ${settings.numberRange}以内 | 题目数量: ${settings.questionCount}题 | 运算类型: ${this.getOperationText(settings.operations)}</p>
            </div>
            <div class="info-fields">
                <div class="info-field">
                    <span>日期：</span>
                    <input type="text" placeholder="___________" />
                </div>
                <div class="info-field">
                    <span>分数：</span>
                    <input type="text" placeholder="___________" />
                </div>
            </div>
            <div class="math-questions">
        `;

        // 添加题目
        for (let i = 0; i < questions.length; i += questionsPerRow) {
            html += '<div class="question-row">';
            
            for (let j = 0; j < questionsPerRow && i + j < questions.length; j++) {
                const question = questions[i + j];
                html += `
                    <div class="question-item" style="width: ${questionWidth}px;">
                        <span class="question-text" style="width: ${textWidth}px;">${question.question}</span>
                        ${includeAnswers ? `<span class="answer-text">${question.answer}</span>` : '<div class="answer-space"></div>'}
                    </div>
                `;
            }
            
            html += '</div>';
        }


        return html;
    }

    // 导出题目为PDF
    async exportQuestionsToPDF(questions, settings) {
        try {
            await this.initializeBrowser();
            const page = await this.browser.newPage();
            
            const html = this.generateHTMLContent(questions, settings, false);
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
            await page.close();
            return pdf;
        } catch (error) {
            throw new Error(`生成PDF失败: ${error.message}`);
        }
    }

    // 导出答案为PDF
    async exportAnswersToPDF(answers, settings) {
        try {
            await this.initializeBrowser();
            const page = await this.browser.newPage();
            
            // 将answers转换为questions格式，但显示答案
            const questionsWithAnswers = answers.map(item => ({
                question: item.question,
                answer: item.answer,
                operation: item.operation
            }));
            
            const html = this.generateHTMLContent(questionsWithAnswers, settings, true);
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
            await page.close();
            return pdf;
        } catch (error) {
            throw new Error(`生成答案PDF失败: ${error.message}`);
        }
    }

    // 获取运算类型文本
    getOperationText(operations) {
        const operationMap = {
            'addition': '加法',
            'subtraction': '减法',
            'multiplication': '乘法',
            'division': '除法'
        };
        return operations.map(op => operationMap[op]).join('、');
    }

    // 保存PDF文件
    async savePDF(filename, pdfData) {
        try {
            const result = await ipcRenderer.invoke('save-pdf', {
                filename: filename,
                data: Buffer.from(pdfData)
            });
            return result;
        } catch (error) {
            throw new Error(`保存PDF失败: ${error.message}`);
        }
    }

    // 保存答案文件
    async saveAnswers(filename, textData) {
        try {
            const result = await ipcRenderer.invoke('save-answers', {
                filename: filename,
                data: textData
            });
            return result;
        } catch (error) {
            throw new Error(`保存答案失败: ${error.message}`);
        }
    }
}
