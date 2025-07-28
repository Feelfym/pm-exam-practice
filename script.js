document.addEventListener('DOMContentLoaded', function() {
    const textareas = document.querySelectorAll('.answer-textarea');
    
    // LocalStorage用のキー
    const STORAGE_KEY = 'pm_exam_practice_data';
    
    // データの保存
    function saveData() {
        const data = {
            timestamp: Date.now(),
            questions: {}
        };
        
        document.querySelectorAll('.question-section').forEach((section, index) => {
            const textarea = section.querySelector('.answer-textarea');
            const headingInputs = section.querySelectorAll('.heading-inputs input');
            
            const questionId = textarea.id;
            data.questions[questionId] = {
                headings: {
                    main: headingInputs[0].value || '',
                    sub1: headingInputs[1].value || '',
                    sub2: headingInputs[2].value || '',
                    sub3: headingInputs[3].value || ''
                },
                content: textarea.value || ''
            };
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // データの復元
    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return false;
            
            const data = JSON.parse(saved);
            let hasData = false;
            
            Object.keys(data.questions).forEach(questionId => {
                const questionData = data.questions[questionId];
                const section = document.querySelector(`#${questionId}`).closest('.question-section');
                const headingInputs = section.querySelectorAll('.heading-inputs input');
                const textarea = section.querySelector('.answer-textarea');
                
                // 見出しの復元
                headingInputs[0].value = questionData.headings.main || '';
                headingInputs[1].value = questionData.headings.sub1 || '';
                headingInputs[2].value = questionData.headings.sub2 || '';
                headingInputs[3].value = questionData.headings.sub3 || '';
                
                // 本文の復元
                textarea.value = questionData.content || '';
                
                if (questionData.content || Object.values(questionData.headings).some(h => h)) {
                    hasData = true;
                }
            });
            
            if (hasData) {
                const lastSaved = new Date(data.timestamp).toLocaleString('ja-JP');
                console.log(`データを復元しました (最終保存: ${lastSaved})`);
            }
            
            return hasData;
        } catch (error) {
            console.error('データの復元に失敗しました:', error);
            return false;
        }
    }
    
    // データの削除
    function clearAllData() {
        if (confirm('すべての入力内容を削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem(STORAGE_KEY);
            
            // フォームをクリア
            document.querySelectorAll('input[type="text"], textarea').forEach(input => {
                input.value = '';
            });
            
            // カウンターをリセット
            textareas.forEach(textarea => {
                const event = new Event('input', { bubbles: true });
                textarea.dispatchEvent(event);
            });
            
            alert('すべてのデータを削除しました。');
        }
    }
    
    // ページ読み込み時にデータを復元
    loadData();
    
    textareas.forEach(textarea => {
        const maxChars = parseInt(textarea.dataset.max);
        const minChars = parseInt(textarea.dataset.min);
        const counter = textarea.parentElement.querySelector('.current-count');
        const maxCounter = textarea.parentElement.querySelector('.max-count');
        const statusIndicator = textarea.parentElement.querySelector('.status-indicator');
        
        // プログレスバーと行数表示の要素を取得
        const progressFill = textarea.parentElement.querySelector('.progress-fill');
        const lineNumberSpan = textarea.parentElement.querySelector('.line-number');
        const remainingCountSpan = textarea.parentElement.querySelector('.remaining-count');
        
        maxCounter.textContent = maxChars;
        
        function calculateCharCount(text) {
            if (!text) return 0;
            
            const lines = text.split('\n');
            let totalChars = 0;
            
            for (let line of lines) {
                if (line.length === 0) {
                    totalChars += 25;
                } else {
                    totalChars += Math.ceil(line.length / 25) * 25;
                }
            }
            
            return totalChars;
        }
        
        function updateStatus(charCount) {
            statusIndicator.className = 'status-indicator';
            
            if (charCount === 0) {
                statusIndicator.textContent = '未入力';
                statusIndicator.classList.add('status-insufficient');
            } else if (charCount > maxChars) {
                statusIndicator.textContent = '文字数超過';
                statusIndicator.classList.add('status-error');
            } else if (minChars > 0 && charCount < minChars) {
                statusIndicator.textContent = '文字数不足';
                statusIndicator.classList.add('status-insufficient');
            } else if (charCount >= maxChars * 0.9) {
                statusIndicator.textContent = '適正（上限近し）';
                statusIndicator.classList.add('status-warning');
            } else {
                statusIndicator.textContent = '適正';
                statusIndicator.classList.add('status-ok');
            }
        }
        
        function handleInput() {
            // IME入力中は自動改行処理をスキップ
            if (isComposing) {
                updateCountersOnly();
                return;
            }
            
            const text = textarea.value;
            const originalCursorPos = textarea.selectionStart;
            const lines = text.split('\n');
            let newText = '';
            let hasChanged = false;
            let newCursorPos = originalCursorPos;
            let currentPos = 0;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                while (line.length > 25) {
                    const breakPoint = 25;
                    newText += line.substring(0, breakPoint);
                    
                    // カーソル位置の調整
                    if (currentPos + breakPoint < originalCursorPos) {
                        newCursorPos++;  // 改行が挿入された分だけカーソルを前に移動
                    } else if (currentPos + breakPoint === originalCursorPos) {
                        newCursorPos++;  // ちょうど改行位置にカーソルがある場合
                    }
                    
                    if (i < lines.length - 1 || line.length > breakPoint) {
                        newText += '\n';
                        currentPos += breakPoint + 1;  // 改行文字も含めて位置を更新
                    }
                    line = line.substring(breakPoint);
                    hasChanged = true;
                }
                newText += line;
                currentPos += line.length;
                if (i < lines.length - 1) {
                    newText += '\n';
                    currentPos++;
                }
            }
            
            if (hasChanged) {
                textarea.value = newText;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
            
            updateCountersOnly();
        }
        
        function updateCountersOnly() {
            const charCount = calculateCharCount(textarea.value);
            const lineCount = textarea.value.split('\n').length;
            
            counter.textContent = charCount;
            updateStatus(charCount);
            
            // プログレスバーの更新
            if (progressFill) {
                const progressPercentage = Math.min((charCount / maxChars) * 100, 100);
                progressFill.style.width = progressPercentage + '%';
                
                // プログレスバーの色を文字数に応じて変更
                if (charCount > maxChars) {
                    progressFill.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
                } else if (minChars > 0 && charCount < minChars) {
                    progressFill.style.background = 'linear-gradient(90deg, #6c757d, #5a6268)';
                } else if (charCount >= maxChars * 0.9) {
                    progressFill.style.background = 'linear-gradient(90deg, #ffc107, #e0a800)';
                } else {
                    progressFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
                }
            }
            
            // 行数表示の更新
            if (lineNumberSpan) {
                lineNumberSpan.textContent = lineCount;
            }
            
            // 現在行の残り文字数を更新
            if (remainingCountSpan) {
                const cursorPos = textarea.selectionStart;
                const currentLineStart = textarea.value.lastIndexOf('\n', cursorPos - 1) + 1;
                const currentLineEnd = textarea.value.indexOf('\n', cursorPos);
                const currentLineLength = currentLineEnd === -1 ? 
                    textarea.value.length - currentLineStart : 
                    currentLineEnd - currentLineStart;
                const remaining = Math.max(0, 25 - currentLineLength);
                remainingCountSpan.textContent = remaining;
            }
            
            // 自動保存（デバウンス）
            saveData();
        }
        
        let isComposing = false;
        
        function handleCompositionStart() {
            isComposing = true;
        }
        
        function handleCompositionEnd() {
            isComposing = false;
            // 変換確定後に自動改行処理を実行
            setTimeout(() => {
                handleInput();
            }, 10);  // 少し遅延を追加してIME処理を完全に終了させる
        }
        
        function handleKeyDown(event) {
            // Enterキーでの行数制限のみ処理
            if (event.key === 'Enter') {
                const lines = textarea.value.split('\n');
                if (lines.length >= Math.floor(maxChars / 25)) {
                    event.preventDefault();
                    return false;
                }
            }
        }
        
        textarea.addEventListener('input', function(event) {
            // IME入力中は自動改行処理をスキップ
            if (!isComposing) {
                handleInput();
            }
        });
        textarea.addEventListener('keydown', handleKeyDown);
        textarea.addEventListener('keyup', function() {
            if (!isComposing) {
                handleInput();
            }
        });
        textarea.addEventListener('click', handleInput);
        textarea.addEventListener('compositionstart', handleCompositionStart);
        textarea.addEventListener('compositionend', handleCompositionEnd);
        textarea.addEventListener('paste', function(event) {
            setTimeout(() => {
                if (!isComposing) {
                    handleInput();
                }
            }, 0);
        });
        
        handleInput();
    });
    
    const headingInputs = document.querySelectorAll('.main-heading, .sub-heading');
    headingInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.length > this.maxLength) {
                this.value = this.value.substring(0, this.maxLength);
            }
            // 見出し変更時も自動保存
            saveData();
        });
    });
    
    // タイマー機能
    let timerInterval = null;
    let timeLeft = 120 * 60; // 120分 = 7200秒
    let isTimerRunning = false;
    
    const timerDisplay = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(3, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
        
        // 時間に応じてタイマーの色を変更
        if (timeLeft <= 300) { // 5分以下
            timerDisplay.style.color = '#e74c3c';
        } else if (timeLeft <= 900) { // 15分以下
            timerDisplay.style.color = '#f39c12';
        } else {
            timerDisplay.style.color = '#2c3e50';
        }
    }
    
    function startTimer() {
        if (!isTimerRunning) {
            isTimerRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                    alert('時間終了です！');
                }
            }, 1000);
        }
    }
    
    function pauseTimer() {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timeLeft = 120 * 60;
        updateTimerDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // タイマーボタンのイベントリスナー
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // 初期表示更新
    updateTimerDisplay();

    function collectData() {
        const sections = document.querySelectorAll('.question-section');
        const data = [];
        
        sections.forEach((section, index) => {
            const sectionTitle = section.querySelector('h2').textContent;
            const headingInputs = section.querySelectorAll('.heading-inputs input');
            const textarea = section.querySelector('.answer-textarea');
            
            const headings = {
                main: headingInputs[0].value || '',
                sub1: headingInputs[1].value || '',
                sub2: headingInputs[2].value || '',
                sub3: headingInputs[3].value || ''
            };
            
            data.push({
                title: sectionTitle,
                headings: headings,
                content: textarea.value || ''
            });
        });
        
        return data;
    }

    function exportAsMarkdown() {
        const data = collectData();
        let markdown = '# プロジェクトマネージャ試験 論述回答\n\n';
        
        data.forEach((section, index) => {
            markdown += `## ${section.title}\n\n`;
            
            if (section.headings.main) {
                markdown += `### ${section.headings.main}\n\n`;
            }
            
            if (section.headings.sub1 || section.headings.sub2 || section.headings.sub3) {
                if (section.headings.sub1) markdown += `- ${section.headings.sub1}\n`;
                if (section.headings.sub2) markdown += `- ${section.headings.sub2}\n`;
                if (section.headings.sub3) markdown += `- ${section.headings.sub3}\n`;
                markdown += '\n';
            }
            
            if (section.content) {
                markdown += '**回答:**\n\n';
                markdown += section.content.replace(/\n/g, '\n\n') + '\n\n';
            }
            
            markdown += '---\n\n';
        });
        
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `PM試験論述回答_${currentDate}.md`;
        downloadFile(markdown, filename, 'text/markdown');
    }

    function exportAsText() {
        const data = collectData();
        let text = 'プロジェクトマネージャ試験 論述回答\n';
        text += '='.repeat(40) + '\n\n';
        
        data.forEach((section, index) => {
            text += `${section.title}\n`;
            text += '-'.repeat(section.title.length) + '\n\n';
            
            if (section.headings.main) {
                text += `大見出し: ${section.headings.main}\n`;
            }
            
            if (section.headings.sub1 || section.headings.sub2 || section.headings.sub3) {
                text += '小見出し:\n';
                if (section.headings.sub1) text += `  - ${section.headings.sub1}\n`;
                if (section.headings.sub2) text += `  - ${section.headings.sub2}\n`;
                if (section.headings.sub3) text += `  - ${section.headings.sub3}\n`;
                text += '\n';
            }
            
            if (section.content) {
                text += '回答:\n';
                text += section.content + '\n\n';
            }
            
            text += '=' .repeat(40) + '\n\n';
        });
        
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `PM試験論述回答_${currentDate}.txt`;
        downloadFile(text, filename, 'text/plain');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // 見出し転記機能
    function insertHeadings(section) {
        const headingInputs = section.querySelectorAll('.heading-inputs input');
        const textarea = section.querySelector('.answer-textarea');
        
        const mainHeading = headingInputs[0].value.trim();
        const subHeadings = [
            headingInputs[1].value.trim(),
            headingInputs[2].value.trim(),
            headingInputs[3].value.trim()
        ].filter(heading => heading !== '');
        
        if (!mainHeading && subHeadings.length === 0) {
            alert('見出しが入力されていません。');
            return;
        }
        
        let headingsText = '';
        
        if (mainHeading) {
            headingsText += '1. ' + mainHeading + '\n';
        }
        
        subHeadings.forEach((subHeading, index) => {
            headingsText += '1.' + (index + 1) + ' ' + subHeading + '\n';
        });
        
        if (headingsText) {
            if (textarea.value && !textarea.value.endsWith('\n')) {
                headingsText = '\n' + headingsText;
            }
            
            const cursorPos = textarea.selectionStart;
            const beforeCursor = textarea.value.substring(0, cursorPos);
            const afterCursor = textarea.value.substring(cursorPos);
            
            textarea.value = beforeCursor + headingsText + afterCursor;
            textarea.setSelectionRange(cursorPos + headingsText.length, cursorPos + headingsText.length);
            
            // 入力イベントを発火してカウンターを更新
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
            
            // データを保存
            saveData();
        }
    }
    
    // 各セクションの見出し転記ボタンにイベントリスナーを追加
    document.querySelectorAll('.insert-headings-btn').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.closest('.question-section');
            insertHeadings(section);
        });
    });

    document.getElementById('exportMd').addEventListener('click', exportAsMarkdown);
    document.getElementById('exportTxt').addEventListener('click', exportAsText);
    document.getElementById('clearAll').addEventListener('click', clearAllData);
});