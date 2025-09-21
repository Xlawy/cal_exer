class MathGenerator {
    constructor() {
        this.questions = [];
        this.answers = [];
    }

    // 生成随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 生成加法题
    generateAddition(maxNumber) {
        const a = this.randomInt(1, maxNumber - 1);
        const b = this.randomInt(1, maxNumber - a);
        const answer = a + b;
        return {
            question: `${a} + ${b} =`,
            answer: answer,
            operation: 'addition'
        };
    }

    // 生成减法题
    generateSubtraction(maxNumber) {
        const a = this.randomInt(1, maxNumber);
        const b = this.randomInt(1, a); // 确保结果为正数
        const answer = a - b;
        return {
            question: `${a} - ${b} =`,
            answer: answer,
            operation: 'subtraction'
        };
    }

    // 生成乘法题
    generateMultiplication(maxNumber) {
        // 限制乘法表的范围，避免过大的数字
        const maxFactor = Math.min(12, Math.floor(Math.sqrt(maxNumber)));
        const a = this.randomInt(1, maxFactor);
        const b = this.randomInt(1, maxFactor);
        const answer = a * b;
        return {
            question: `${a} × ${b} =`,
            answer: answer,
            operation: 'multiplication'
        };
    }

    // 生成除法题
    generateDivision(maxNumber) {
        // 生成能整除的除法题
        const divisor = this.randomInt(2, 12);
        const quotient = this.randomInt(1, Math.floor(maxNumber / divisor));
        const dividend = divisor * quotient;
        const answer = quotient;
        return {
            question: `${dividend} ÷ ${divisor} =`,
            answer: answer,
            operation: 'division'
        };
    }

    // 根据设置生成题目
    generateQuestions(settings) {
        this.questions = [];
        this.answers = [];
        
        const { numberRange, operations, questionCount } = settings;
        const maxNumber = parseInt(numberRange);
        
        // 确保至少选择一种运算
        if (operations.length === 0) {
            throw new Error('请至少选择一种运算类型');
        }

        for (let i = 0; i < questionCount; i++) {
            const operation = operations[this.randomInt(0, operations.length - 1)];
            let question;

            switch (operation) {
                case 'addition':
                    question = this.generateAddition(maxNumber);
                    break;
                case 'subtraction':
                    question = this.generateSubtraction(maxNumber);
                    break;
                case 'multiplication':
                    question = this.generateMultiplication(maxNumber);
                    break;
                case 'division':
                    question = this.generateDivision(maxNumber);
                    break;
            }

            this.questions.push(question);
            this.answers.push({
                question: question.question,
                answer: question.answer,
                operation: question.operation
            });
        }

        return {
            questions: this.questions,
            answers: this.answers
        };
    }

    // 格式化题目为HTML
    formatQuestionsHTML(questions, questionsPerRow, includeAnswers = false) {
        if (questions.length === 0) {
            return '<p class="placeholder">没有生成题目</p>';
        }

        // 计算每道题的宽度：容器宽度 / 题目数量
        // 假设容器宽度为800px，减去边距和间距
        const containerWidth = 800;
        const margin = 40; // 左右边距
        const gap = 15; // 题目间距
        const answerSpace = 80; // 答案区域宽度
        const padding = 20; // 题目项内边距
        const availableWidth = containerWidth - margin;
        const questionWidth = Math.floor((availableWidth - (questionsPerRow - 1) * gap) / questionsPerRow);
        const textWidth = questionWidth - answerSpace - padding; // 题目文本实际可用宽度
        
        let html = '<div class="math-questions">';
        
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
        
        html += '</div>';
        return html;
    }

    // 格式化答案为文本
    formatAnswersText(answers) {
        let text = '数学练习题答案\n';
        text += '='.repeat(30) + '\n\n';
        
        answers.forEach((item, index) => {
            text += `${index + 1}. ${item.question} ${item.answer}\n`;
        });
        
        text += '\n' + '='.repeat(30) + '\n';
        text += `共 ${answers.length} 题`;
        
        return text;
    }

    // 获取当前题目数据
    getCurrentQuestions() {
        return this.questions;
    }

    // 获取当前答案数据
    getCurrentAnswers() {
        return this.answers;
    }
}
