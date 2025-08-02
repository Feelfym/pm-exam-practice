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
            const mainHeadingInput = section.querySelector('.main-heading');
            const subSections = section.querySelectorAll('.sub-section');
            
            const questionId = textarea.id;
            const headings = {
                main: mainHeadingInput.value || ''
            };
            
            subSections.forEach((subSection, subIndex) => {
                const subHeadingInput = subSection.querySelector('.sub-heading');
                const subtopicInputs = subSection.querySelectorAll('.subtopic');
                
                headings[`sub${subIndex + 1}`] = subHeadingInput.value || '';
                headings[`sub${subIndex + 1}_topic1`] = subtopicInputs[0].value || '';
                headings[`sub${subIndex + 1}_topic2`] = subtopicInputs[1].value || '';
            });
            
            data.questions[questionId] = {
                headings: headings,
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
                const mainHeadingInput = section.querySelector('.main-heading');
                const subSections = section.querySelectorAll('.sub-section');
                const textarea = section.querySelector('.answer-textarea');
                
                // 大見出しの復元
                mainHeadingInput.value = questionData.headings.main || '';
                
                // 小見出しとサブトピックの復元
                subSections.forEach((subSection, subIndex) => {
                    const subHeadingInput = subSection.querySelector('.sub-heading');
                    const subtopicInputs = subSection.querySelectorAll('.subtopic');
                    
                    subHeadingInput.value = questionData.headings[`sub${subIndex + 1}`] || '';
                    subtopicInputs[0].value = questionData.headings[`sub${subIndex + 1}_topic1`] || '';
                    subtopicInputs[1].value = questionData.headings[`sub${subIndex + 1}_topic2`] || '';
                });
                
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
    
    const headingInputs = document.querySelectorAll('.main-heading, .sub-heading, .subtopic');
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
            const mainHeadingInput = section.querySelector('.main-heading');
            const subSections = section.querySelectorAll('.sub-section');
            const textarea = section.querySelector('.answer-textarea');
            
            const headings = {
                main: mainHeadingInput.value || ''
            };
            
            subSections.forEach((subSection, subIndex) => {
                const subHeadingInput = subSection.querySelector('.sub-heading');
                const subtopicInputs = subSection.querySelectorAll('.subtopic');
                
                headings[`sub${subIndex + 1}`] = subHeadingInput.value || '';
                headings[`sub${subIndex + 1}_topic1`] = subtopicInputs[0].value || '';
                headings[`sub${subIndex + 1}_topic2`] = subtopicInputs[1].value || '';
            });
            
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
        const textarea = section.querySelector('.answer-textarea');
        const mainHeadingInput = section.querySelector('.main-heading');
        const subSections = section.querySelectorAll('.sub-section');
        
        const mainHeading = mainHeadingInput.value.trim();
        
        let hasContent = mainHeading !== '';
        let headingsText = '';
        
        if (mainHeading) {
            headingsText += '1. ' + mainHeading + '\n';
        }
        
        subSections.forEach((subSection, index) => {
            const subHeadingInput = subSection.querySelector('.sub-heading');
            const subtopicInputs = subSection.querySelectorAll('.subtopic');
            
            const subHeading = subHeadingInput.value.trim();
            const subtopics = Array.from(subtopicInputs).map(input => input.value.trim()).filter(text => text !== '');
            
            if (subHeading) {
                hasContent = true;
                headingsText += '1.' + (index + 1) + ' ' + subHeading + '\n';
                
                // サブトピックがある場合は追加
                subtopics.forEach((subtopic, subIndex) => {
                    headingsText += '(' + (subIndex + 1) + ') ' + subtopic + '\n';
                });
            }
        });
        
        if (!hasContent) {
            alert('見出しが入力されていません。');
            return;
        }
        
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

    // クリアボタンのイベントリスナーを追加
    document.querySelectorAll('.clear-section-btn').forEach(button => {
        button.addEventListener('click', function() {
            const sectionLetter = this.getAttribute('data-section');
            clearSection(sectionLetter);
        });
    });

    // セクションクリア機能
    function clearSection(sectionLetter) {
        if (!confirm(`設問${sectionLetter}の入力内容をすべてクリアしますか？`)) {
            return;
        }

        const sectionMap = {
            'A': 'questionA',
            'B': 'questionB', 
            'C': 'questionC'
        };
        
        const textareaId = sectionMap[sectionLetter];
        const section = document.querySelector(`#${textareaId}`).closest('.question-section');
        
        // 見出し入力欄をクリア
        const headingInputs = section.querySelectorAll('.main-heading, .sub-heading, .subtopic');
        headingInputs.forEach(input => {
            input.value = '';
        });
        
        // テキストエリアをクリア
        const textarea = section.querySelector('.answer-textarea');
        textarea.value = '';
        
        // 文字数カウンターを更新
        updateCharCount(textarea);
        
        // ローカルストレージからデータを削除
        clearSectionFromStorage(sectionLetter);
        
        console.log(`設問${sectionLetter}の入力内容をクリアしました`);
    }

    // ローカルストレージから特定セクションのデータを削除
    function clearSectionFromStorage(sectionLetter) {
        const sectionMap = {
            'A': 'questionA',
            'B': 'questionB',
            'C': 'questionC'
        };
        
        const textareaId = sectionMap[sectionLetter];
        
        // テキストエリアのデータを削除
        localStorage.removeItem(textareaId);
        
        // 見出しデータを削除
        const headingKeys = [
            `${sectionLetter}_main_heading`,
            `${sectionLetter}_sub_heading_1`, `${sectionLetter}_sub_heading_2`, `${sectionLetter}_sub_heading_3`,
            `${sectionLetter}_subtopic_1_1`, `${sectionLetter}_subtopic_1_2`,
            `${sectionLetter}_subtopic_2_1`, `${sectionLetter}_subtopic_2_2`,
            `${sectionLetter}_subtopic_3_1`, `${sectionLetter}_subtopic_3_2`
        ];
        
        headingKeys.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    function exportForAIGrading() {
        const data = collectData();
        let aiPromptText = `以下は、プロジェクトマネージャ試験の午後Ⅱ（論述式試験）の回答です。以下の採点基準に従って評価し、改善点を具体的に指摘してください：

【採点基準】
1. 章立て・構成: 適切な見出しや章立てがされているか
2. 段落設定: 論理的な段落構成になっているか
3. 内容の具体性: 抽象的でなく、具体的な内容が記述されているか
4. 設問への適合性: テーマや設問の要求に適切に答えているか
5. 問題文の反映: 問題文の内容や条件を正しく反映しているか
6. 関連性: 設問に関係のない無関係な内容や自慢話になっていないか
7. 回答の妥当性: 問題の意図を正しく理解し、適切に答えているか

【評価方法】
- 各項目を5段階（優秀:5、良好:4、普通:3、要改善:2、不十分:1）で評価
- 各設問ごとに総合コメントを記述
- 全体的な改善提案を提示

===========================================

`;
        
        data.forEach((section, index) => {
            aiPromptText += `## ${section.title}\n\n`;
            
            if (section.headings.main) {
                aiPromptText += `### 設定した見出し構成\n`;
                aiPromptText += `**大見出し:** ${section.headings.main}\n`;
                
                let hasSubHeadings = false;
                if (section.headings.sub1 || section.headings.sub2 || section.headings.sub3) {
                    aiPromptText += `**小見出し:**\n`;
                    if (section.headings.sub1) {
                        aiPromptText += `- 1.1 ${section.headings.sub1}\n`;
                        // サブトピックがある場合
                        if (section.headings.sub1_topic1 || section.headings.sub1_topic2) {
                            if (section.headings.sub1_topic1) aiPromptText += `  - (1) ${section.headings.sub1_topic1}\n`;
                            if (section.headings.sub1_topic2) aiPromptText += `  - (2) ${section.headings.sub1_topic2}\n`;
                        }
                    }
                    if (section.headings.sub2) {
                        aiPromptText += `- 1.2 ${section.headings.sub2}\n`;
                        if (section.headings.sub2_topic1 || section.headings.sub2_topic2) {
                            if (section.headings.sub2_topic1) aiPromptText += `  - (1) ${section.headings.sub2_topic1}\n`;
                            if (section.headings.sub2_topic2) aiPromptText += `  - (2) ${section.headings.sub2_topic2}\n`;
                        }
                    }
                    if (section.headings.sub3) {
                        aiPromptText += `- 1.3 ${section.headings.sub3}\n`;
                        if (section.headings.sub3_topic1 || section.headings.sub3_topic2) {
                            if (section.headings.sub3_topic1) aiPromptText += `  - (1) ${section.headings.sub3_topic1}\n`;
                            if (section.headings.sub3_topic2) aiPromptText += `  - (2) ${section.headings.sub3_topic2}\n`;
                        }
                    }
                    hasSubHeadings = true;
                }
                aiPromptText += '\n';
            }
            
            if (section.content) {
                aiPromptText += `### 回答内容\n`;
                aiPromptText += section.content + '\n\n';
            } else {
                aiPromptText += `### 回答内容\n（未記入）\n\n`;
            }
            
            aiPromptText += '---\n\n';
        });
        
        aiPromptText += `【採点をお願いします】
上記の回答について、各採点基準に沿って詳細な評価とフィードバックをお願いします。
特に、プロジェクトマネージャとしての実務経験や知識が適切に反映されているか、
論述式試験として求められる論理的構成になっているかを重点的に評価してください。`;
        
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `PM試験AI採点用_${currentDate}.txt`;
        downloadFile(aiPromptText, filename, 'text/plain');
    }

    document.getElementById('exportMd').addEventListener('click', exportAsMarkdown);
    document.getElementById('exportTxt').addEventListener('click', exportAsText);
    document.getElementById('exportAI').addEventListener('click', exportForAIGrading);
    document.getElementById('clearAll').addEventListener('click', clearAllData);
});