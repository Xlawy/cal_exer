const { ipcRenderer } = require('electron');

class PDFExporter {
    constructor() {
        this.jsPDF = null;
        this.initializePDF();
    }

    async initializePDF() {
        // 动态导入jsPDF
        try {
            const jsPDF = require('jspdf');
            this.jsPDF = jsPDF;
        } catch (error) {
            console.error('无法加载jsPDF:', error);
        }
    }

    // 导出题目为PDF
    async exportQuestionsToPDF(questions, settings) {
        if (!this.jsPDF) {
            throw new Error('PDF库未正确加载');
        }

        const doc = new this.jsPDF.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        
        let yPosition = margin;
        const lineHeight = 8;
        const questionSpacing = 15;

        // 添加标题 - 使用英文避免乱码
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Math Exercises', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // 添加设置信息 - 使用英文避免乱码
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const settingsText = `Range: Within ${settings.numberRange} | Questions: ${settings.questionCount} | Operations: ${this.getOperationTextEn(settings.operations)}`;
        doc.text(settingsText, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        // 添加题目
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        
        const questionsPerRow = parseInt(settings.questionsPerRow);
        const questionWidth = contentWidth / questionsPerRow;
        
        for (let i = 0; i < questions.length; i += questionsPerRow) {
            // 检查是否需要新页面
            if (yPosition + questionSpacing > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            // 生成一行题目
            for (let j = 0; j < questionsPerRow && i + j < questions.length; j++) {
                const question = questions[i + j];
                const xPosition = margin + j * questionWidth;
                
                // 题目文本
                doc.text(question.question, xPosition, yPosition);
                
                // 答案线
                const textWidth = doc.getTextWidth(question.question);
                const lineStartX = xPosition + textWidth + 5;
                const lineEndX = xPosition + questionWidth - 10;
                doc.line(lineStartX, yPosition - 2, lineEndX, yPosition - 2);
            }
            
            yPosition += questionSpacing;
        }

        // 添加页脚
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        return doc.output('arraybuffer');
    }

    // 导出答案为PDF
    async exportAnswersToPDF(answers, settings) {
        if (!this.jsPDF) {
            throw new Error('PDF库未正确加载');
        }

        const doc = new this.jsPDF.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        let yPosition = margin;
        const lineHeight = 8;

        // 添加标题 - 使用英文避免乱码
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Math Exercises Answers', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // 添加设置信息 - 使用英文避免乱码
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const settingsText = `Range: Within ${settings.numberRange} | Questions: ${settings.questionCount} | Operations: ${this.getOperationTextEn(settings.operations)}`;
        doc.text(settingsText, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        // 添加答案
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        
        answers.forEach((item, index) => {
            // 检查是否需要新页面
            if (yPosition + lineHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            const answerText = `${index + 1}. ${item.question} ${item.answer}`;
            doc.text(answerText, margin, yPosition);
            yPosition += lineHeight + 2;
        });

        // 添加页脚
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        return doc.output('arraybuffer');
    }

    // 获取运算类型文本（中文）
    getOperationText(operations) {
        const operationMap = {
            'addition': '加法',
            'subtraction': '减法',
            'multiplication': '乘法',
            'division': '除法'
        };
        return operations.map(op => operationMap[op]).join('、');
    }

    // 获取运算类型文本（英文）
    getOperationTextEn(operations) {
        const operationMap = {
            'addition': 'Addition',
            'subtraction': 'Subtraction',
            'multiplication': 'Multiplication',
            'division': 'Division'
        };
        return operations.map(op => operationMap[op]).join(', ');
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