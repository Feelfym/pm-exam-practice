document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'pm_project_data';
    
    // プロジェクトデータの構造
    const projectFields = {
        projectName: 'プロジェクト名',
        projectPeriod: '期間',
        teamComposition: 'チーム構成',
        roleAssignment: '役割分担',
        organizationStructure: '組織体制',
        budgetScale: '予算規模',
        humanResources: '人的リソース',
        systemScale: 'システム規模',
        problemIssues: '課題・問題',
        solutionNeed: '解決必要性',
        projectGenesis: 'プロジェクト発足経緯',
        businessGoals: '業務目標',
        systemGoals: 'システム目標',
        projectGoals: 'プロジェクト目標',
        technicalFeatures: '技術的特徴',
        managementFeatures: '管理手法の特徴',
        businessFeatures: '業務面の特徴'
    };
    
    // データの保存
    function saveProjectData() {
        const data = {
            timestamp: Date.now(),
            project: {}
        };
        
        Object.keys(projectFields).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                data.project[fieldId] = element.value || '';
            }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // データの復元
    function loadProjectData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return false;
            
            const data = JSON.parse(saved);
            let hasData = false;
            
            Object.keys(projectFields).forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element && data.project[fieldId]) {
                    element.value = data.project[fieldId];
                    hasData = true;
                }
            });
            
            if (hasData) {
                const lastSaved = new Date(data.timestamp).toLocaleString('ja-JP');
                console.log(`プロジェクトデータを復元しました (最終保存: ${lastSaved})`);
            }
            
            return hasData;
        } catch (error) {
            console.error('プロジェクトデータの復元に失敗しました:', error);
            return false;
        }
    }
    
    // データの削除
    function clearProjectData() {
        if (confirm('すべてのプロジェクト情報を削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem(STORAGE_KEY);
            
            // フォームをクリア
            Object.keys(projectFields).forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = '';
                }
            });
            
            alert('すべてのプロジェクトデータを削除しました。');
        }
    }
    
    // プロジェクトデータの収集
    function collectProjectData() {
        const data = {};
        Object.keys(projectFields).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                data[fieldId] = element.value || '';
            }
        });
        return data;
    }
    
    // Markdownエクスポート
    function exportProjectAsMarkdown() {
        const data = collectProjectData();
        let markdown = '# プロジェクト情報\n\n';
        
        // プロジェクト名
        if (data.projectName) {
            markdown += `## ${data.projectName}\n\n`;
        }
        
        // 基本情報
        if (data.projectPeriod) {
            markdown += '## 基本情報\n\n';
            markdown += `**期間:** ${data.projectPeriod}\n\n`;
        }
        
        // プロジェクト体制
        if (data.teamComposition || data.roleAssignment || data.organizationStructure) {
            markdown += '## プロジェクト体制\n\n';
            if (data.teamComposition) {
                markdown += '**チーム構成:**\n' + data.teamComposition + '\n\n';
            }
            if (data.roleAssignment) {
                markdown += '**役割分担:**\n' + data.roleAssignment + '\n\n';
            }
            if (data.organizationStructure) {
                markdown += '**組織体制:**\n' + data.organizationStructure + '\n\n';
            }
        }
        
        // プロジェクト規模
        if (data.budgetScale || data.humanResources || data.systemScale) {
            markdown += '## プロジェクト規模\n\n';
            if (data.budgetScale) {
                markdown += '**予算規模:**\n' + data.budgetScale + '\n\n';
            }
            if (data.humanResources) {
                markdown += '**人的リソース:**\n' + data.humanResources + '\n\n';
            }
            if (data.systemScale) {
                markdown += '**システム規模:**\n' + data.systemScale + '\n\n';
            }
        }
        
        // 背景・経緯
        if (data.problemIssues || data.solutionNeed || data.projectGenesis) {
            markdown += '## 背景・経緯\n\n';
            if (data.problemIssues) {
                markdown += '**課題・問題:**\n' + data.problemIssues + '\n\n';
            }
            if (data.solutionNeed) {
                markdown += '**解決必要性:**\n' + data.solutionNeed + '\n\n';
            }
            if (data.projectGenesis) {
                markdown += '**プロジェクト発足経緯:**\n' + data.projectGenesis + '\n\n';
            }
        }
        
        // 目標設定
        if (data.businessGoals || data.systemGoals || data.projectGoals) {
            markdown += '## 目標設定\n\n';
            if (data.businessGoals) {
                markdown += '**業務目標:**\n' + data.businessGoals + '\n\n';
            }
            if (data.systemGoals) {
                markdown += '**システム目標:**\n' + data.systemGoals + '\n\n';
            }
            if (data.projectGoals) {
                markdown += '**プロジェクト目標:**\n' + data.projectGoals + '\n\n';
            }
        }
        
        // 特徴・独自性
        if (data.technicalFeatures || data.managementFeatures || data.businessFeatures) {
            markdown += '## 特徴・独自性\n\n';
            if (data.technicalFeatures) {
                markdown += '**技術的特徴:**\n' + data.technicalFeatures + '\n\n';
            }
            if (data.managementFeatures) {
                markdown += '**管理手法の特徴:**\n' + data.managementFeatures + '\n\n';
            }
            if (data.businessFeatures) {
                markdown += '**業務面の特徴:**\n' + data.businessFeatures + '\n\n';
            }
        }
        
        const currentDate = new Date().toISOString().split('T')[0];
        const projectName = data.projectName ? data.projectName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') : 'プロジェクト情報';
        const filename = `${projectName}_${currentDate}.md`;
        downloadFile(markdown, filename, 'text/markdown');
    }
    
    // テキストエクスポート
    function exportProjectAsText() {
        const data = collectProjectData();
        let text = 'プロジェクト情報\n';
        text += '='.repeat(50) + '\n\n';
        
        // プロジェクト名
        if (data.projectName) {
            text += `プロジェクト名: ${data.projectName}\n\n`;
        }
        
        // 各項目を順番に出力
        const sections = [
            { key: 'projectPeriod', label: '期間' },
            { key: 'teamComposition', label: 'チーム構成' },
            { key: 'roleAssignment', label: '役割分担' },
            { key: 'organizationStructure', label: '組織体制' },
            { key: 'budgetScale', label: '予算規模' },
            { key: 'humanResources', label: '人的リソース' },
            { key: 'systemScale', label: 'システム規模' },
            { key: 'problemIssues', label: '課題・問題' },
            { key: 'solutionNeed', label: '解決必要性' },
            { key: 'projectGenesis', label: 'プロジェクト発足経緯' },
            { key: 'businessGoals', label: '業務目標' },
            { key: 'systemGoals', label: 'システム目標' },
            { key: 'projectGoals', label: 'プロジェクト目標' },
            { key: 'technicalFeatures', label: '技術的特徴' },
            { key: 'managementFeatures', label: '管理手法の特徴' },
            { key: 'businessFeatures', label: '業務面の特徴' }
        ];
        
        sections.forEach(section => {
            if (data[section.key]) {
                text += `${section.label}:\n`;
                text += '-'.repeat(section.label.length + 1) + '\n';
                text += data[section.key] + '\n\n';
            }
        });
        
        text += '='.repeat(50) + '\n';
        text += `出力日時: ${new Date().toLocaleString('ja-JP')}\n`;
        
        const currentDate = new Date().toISOString().split('T')[0];
        const projectName = data.projectName ? data.projectName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') : 'プロジェクト情報';
        const filename = `${projectName}_${currentDate}.txt`;
        downloadFile(text, filename, 'text/plain');
    }
    
    // JSONエクスポート
    function exportProjectAsJson() {
        const data = collectProjectData();
        const exportData = {
            exportDate: new Date().toISOString(),
            projectInfo: {
                name: data.projectName || '',
                period: data.projectPeriod || '',
                team: {
                    composition: data.teamComposition || '',
                    roleAssignment: data.roleAssignment || '',
                    organizationStructure: data.organizationStructure || ''
                },
                scale: {
                    budget: data.budgetScale || '',
                    humanResources: data.humanResources || '',
                    system: data.systemScale || ''
                },
                background: {
                    problems: data.problemIssues || '',
                    solutionNeed: data.solutionNeed || '',
                    genesis: data.projectGenesis || ''
                },
                goals: {
                    business: data.businessGoals || '',
                    system: data.systemGoals || '',
                    project: data.projectGoals || ''
                },
                features: {
                    technical: data.technicalFeatures || '',
                    management: data.managementFeatures || '',
                    business: data.businessFeatures || ''
                }
            }
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        
        const currentDate = new Date().toISOString().split('T')[0];
        const projectName = data.projectName ? data.projectName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') : 'プロジェクト情報';
        const filename = `${projectName}_${currentDate}.json`;
        downloadFile(jsonString, filename, 'application/json');
    }
    
    // ファイルダウンロード
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
    
    // 文字数制限の処理
    function setupCharacterLimits() {
        Object.keys(projectFields).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', function() {
                    const maxLength = parseInt(this.maxLength);
                    if (this.value.length > maxLength) {
                        this.value = this.value.substring(0, maxLength);
                    }
                    // 自動保存
                    saveProjectData();
                });
            }
        });
    }
    
    // 初期化
    function init() {
        // 保存されたデータを復元
        loadProjectData();
        
        // 文字数制限とオートセーブの設定
        setupCharacterLimits();
        
        // エクスポートボタンのイベントリスナー設定
        document.getElementById('exportProjectMarkdown').addEventListener('click', exportProjectAsMarkdown);
        document.getElementById('exportProjectText').addEventListener('click', exportProjectAsText);
        document.getElementById('exportProjectJson').addEventListener('click', exportProjectAsJson);
        document.getElementById('clearProjectData').addEventListener('click', clearProjectData);
    }
    
    // DOMContentLoaded後に初期化実行
    init();
});