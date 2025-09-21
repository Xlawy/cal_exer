class MathExerciseApp {
    constructor() {
        this.mathGenerator = new MathGenerator();
        this.pdfExporter = new HTMLPDFExporter();
        this.currentSettings = null;
        this.currentQuestions = [];
        this.currentAnswers = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 生成按钮
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateQuestions();
        });

        // 下载题目PDF按钮
        document.getElementById('downloadQuestionsBtn').addEventListener('click', () => {
            this.downloadQuestionsPDF();
        });

        // 下载答案PDF按钮
        document.getElementById('downloadAnswersBtn').addEventListener('click', () => {
            this.downloadAnswersPDF();
        });

        // 生成题目和答案PDF按钮
        document.getElementById('printBtn').addEventListener('click', () => {
            this.generateBothPDFs();
        });

        // 实时预览
        this.setupRealTimePreview();
    }

    setupRealTimePreview() {
        const inputs = document.querySelectorAll('#numberRange, #questionCount, #questionsPerRow, input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (this.currentQuestions.length > 0) {
                    this.updatePreview();
                }
            });
        });
    }

    getSettings() {
        const operations = [];
        if (document.getElementById('addition').checked) operations.push('addition');
        if (document.getElementById('subtraction').checked) operations.push('subtraction');
        if (document.getElementById('multiplication').checked) operations.push('multiplication');
        if (document.getElementById('division').checked) operations.push('division');

        return {
            numberRange: document.getElementById('numberRange').value,
            operations: operations,
            questionCount: parseInt(document.getElementById('questionCount').value),
            questionsPerRow: document.getElementById('questionsPerRow').value,
            showPreview: document.getElementById('showPreview').checked
        };
    }

    async generateQuestions() {
        try {
            const settings = this.getSettings();
            
            // 验证设置
            if (settings.operations.length === 0) {
                this.showMessage('请至少选择一种运算类型！', 'error');
                return;
            }

            if (settings.questionCount < 5 || settings.questionCount > 80) {
                this.showMessage('题目数量必须在5-80之间！', 'error');
                return;
            }

            // 显示加载状态
            this.showLoading(true);

            // 生成题目
            const result = this.mathGenerator.generateQuestions(settings);
            this.currentQuestions = result.questions;
            this.currentAnswers = result.answers;
            this.currentSettings = settings;

            // 根据设置更新预览
            this.updatePreview();

            // 启用下载按钮
            this.enableDownloadButtons(true);

            // 显示成功消息
            if (settings.showPreview) {
                this.showMessage(`成功生成 ${result.questions.length} 道题目！可以下载PDF文件。`, 'success');
            } else {
                this.showMessage(`成功生成 ${result.questions.length} 道题目！可以下载PDF文件。`, 'success');
            }

        } catch (error) {
            this.showMessage(`生成题目失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updatePreview() {
        const previewArea = document.getElementById('previewArea');
        const previewTitle = document.getElementById('previewTitle');
        const settings = this.getSettings();
        
        if (this.currentQuestions.length === 0) {
            previewArea.innerHTML = '<p class="placeholder">点击"生成练习题"按钮开始生成题目</p>';
            previewTitle.textContent = '📋 题目预览';
            return;
        }

        // 根据预览选项显示不同内容
        if (settings.showPreview) {
            previewTitle.textContent = '📋 题目预览';
            const questionsPerRow = parseInt(settings.questionsPerRow);
            
            const html = this.mathGenerator.formatQuestionsHTML(
                this.currentQuestions, 
                questionsPerRow, 
                false  // 预览中不显示答案
            );
            
            previewArea.innerHTML = html;
        } else {
            previewTitle.textContent = '✅ 生成成功';
            previewArea.innerHTML = `
                <div class="success-message">
                    <h3>🎉 题目生成完成！</h3>
                    <p>已成功生成 <strong>${this.currentQuestions.length}</strong> 道题目</p>
                    <p>数字范围：<strong>${settings.numberRange}以内</strong></p>
                    <p>运算类型：<strong>${this.getOperationText(settings.operations)}</strong></p>
                    <p>每行题目数：<strong>${settings.questionsPerRow}题</strong></p>
                    <div class="action-hint">
                        <p>💡 您可以直接导出PDF或答案文件</p>
                    </div>
                </div>
            `;
        }
    }

    async downloadQuestionsPDF() {
        if (this.currentQuestions.length === 0) {
            this.showMessage('请先生成题目！', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `数学练习题_${this.currentSettings.numberRange}以内_${timestamp}_题目.pdf`;
            
            const pdfData = await this.pdfExporter.exportQuestionsToPDF(
                this.currentQuestions, 
                this.currentSettings
            );
            
            const result = await this.pdfExporter.savePDF(filename, pdfData);
            
            if (result.success) {
                this.showMessage(`题目PDF已保存到: ${result.path}`, 'success');
            } else {
                this.showMessage(result.message, 'error');
            }

        } catch (error) {
            this.showMessage(`下载题目PDF失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async downloadAnswersPDF() {
        if (this.currentAnswers.length === 0) {
            this.showMessage('请先生成题目！', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `数学练习题_${this.currentSettings.numberRange}以内_${timestamp}_答案.pdf`;
            
            const pdfData = await this.pdfExporter.exportAnswersToPDF(
                this.currentAnswers, 
                this.currentSettings
            );
            
            const result = await this.pdfExporter.savePDF(filename, pdfData);
            
            if (result.success) {
                this.showMessage(`答案PDF已保存到: ${result.path}`, 'success');
            } else {
                this.showMessage(result.message, 'error');
            }

        } catch (error) {
            this.showMessage(`下载答案PDF失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async generateBothPDFs() {
        if (this.currentQuestions.length === 0) {
            this.showMessage('请先生成题目！', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const baseFilename = `数学练习题_${this.currentSettings.numberRange}以内_${timestamp}`;
            
            // 先生成题目PDF
            const questionsResult = await this.generateQuestionsPDF(baseFilename);
            if (!questionsResult.success) {
                this.showMessage(`生成题目PDF失败: ${questionsResult.message}`, 'error');
                return;
            }
            
            // 再生成答案PDF
            const answersResult = await this.generateAnswersPDF(baseFilename);
            if (!answersResult.success) {
                this.showMessage(`生成答案PDF失败: ${answersResult.message}`, 'error');
                return;
            }
            
            this.showMessage(`成功生成题目和答案PDF！`, 'success');

        } catch (error) {
            this.showMessage(`生成PDF失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async generateQuestionsPDF(baseFilename) {
        try {
            const pdfData = await this.pdfExporter.exportQuestionsToPDF(
                this.currentQuestions, 
                this.currentSettings
            );
            
            const result = await this.pdfExporter.savePDF(
                `${baseFilename}_题目.pdf`, 
                pdfData
            );
            
            return result;
        } catch (error) {
            console.error('生成题目PDF失败:', error);
            return { success: false, message: error.message };
        }
    }

    async generateAnswersPDF(baseFilename) {
        try {
            const pdfData = await this.pdfExporter.exportAnswersToPDF(
                this.currentAnswers, 
                this.currentSettings
            );
            
            const result = await this.pdfExporter.savePDF(
                `${baseFilename}_答案.pdf`, 
                pdfData
            );
            
            return result;
        } catch (error) {
            console.error('生成答案PDF失败:', error);
            return { success: false, message: error.message };
        }
    }

    enableDownloadButtons(enabled) {
        const buttons = ['downloadQuestionsBtn', 'downloadAnswersBtn', 'printBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            btn.disabled = !enabled;
        });
    }

    showLoading(show) {
        const generateBtn = document.getElementById('generateBtn');
        if (show) {
            generateBtn.textContent = '⏳ 生成中...';
            generateBtn.disabled = true;
        } else {
            generateBtn.textContent = '🎯 生成练习题';
            generateBtn.disabled = false;
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

    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // 添加样式
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // 设置颜色
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            info: '#4299e1'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 显示动画
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
}

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MathExerciseApp();
});
