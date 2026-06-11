const fs = require('fs');

// 1. Update SuperAdminClient.tsx
let clientStr = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');
clientStr = clientStr.replace(/const submit = \(finalThumb: string\) => \{[\s\S]*?reader\.readAsDataURL\(selectedFile\);\n    \} else \{\n        submit\(defaultThumb\); \/\/ Fallback to default if no file selected\n    \}/, `const formData = new FormData();
        formData.append('type', uploadMode);
        formData.append('title', fd.get('title') as string);
        formData.append('category', fd.get('category') as string);
        formData.append('thumbnail', defaultThumb);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        startTransition(async () => {
            const res = await uploadTool(formData);
            if (res && res.success) {
                setMediaList([{
                    id: Date.now().toString(), 
                    type: uploadMode,
                    title: fd.get('title') as string,
                    category: fd.get('category') as string,
                    thumbnail: res.thumbnail,
                    url: res.toolUrl,
                    uploadedAt: new Date().toISOString().split('T')[0]
                }, ...mediaList]);
                setIsUploadModalOpen(false);
                setSelectedFile(null);
                alert("資材已即時同步至全球網域節點，所有業務端、經銷商、高級業務員介面均已更新 ⚡");
            } else {
                alert("上傳失敗！");
            }
        });`);
fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', clientStr);


// 2. Update page.tsx (SuperSales)
let pageStr = fs.readFileSync('src/app/super-sales/[salesId]/page.tsx', 'utf8');
// Fix the onClick payload for activeToolPreview
pageStr = pageStr.replace(/onClick=\{\(\) => setActiveToolPreview\(\{\n               type: tool\.type, title: tool\.title, url: tool\.thumbnail, category: tool\.category\n             \}\)\}/g, `onClick={() => setActiveToolPreview({
               type: tool.type, title: tool.title, url: tool.url || tool.thumbnail, category: tool.category, thumbnail: tool.thumbnail
             })}`);

fs.writeFileSync('src/app/super-sales/[salesId]/page.tsx', pageStr);
