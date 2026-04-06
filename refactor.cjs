const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('c:/Generic QBMS/FrontEnd/genericQBMSUI/src');
const qbDir = path.join(srcDir, 'features/questionBank');

const fileMoves = {
    'editorContext.js': 'contexts/editorContext.js',
    'localizationContext.js': 'contexts/localizationContext.js',
    'questionUtils.js': 'utils/questionUtils.js',
    'constants.js': 'utils/constants.js',
    'api.js': 'services/api.js',
    'state.js': 'store/state.js',
    'editorConfig.js': 'config/editorConfig.js',
    'i18n.js': 'config/i18n.js'
};

const fileMap = {};
for (const [oldName, newRelPath] of Object.entries(fileMoves)) {
    const oldPath = path.join(qbDir, oldName).replace(/\\/g, '/');
    const newPath = path.join(qbDir, newRelPath).replace(/\\/g, '/');
    fileMap[oldPath] = newPath;
}

const dirs = new Set(Object.values(fileMoves).map(p => path.dirname(path.join(qbDir, p))));
for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.match(/\.jsx?$/)) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    content = content.replace(importRegex, (match, importPath) => {
        if (!importPath.startsWith('.')) return match;
        
        let resolvedImportOldPath;
        if (importPath.endsWith('.js') || importPath.endsWith('.jsx')) {
           resolvedImportOldPath = path.resolve(path.dirname(filePath), importPath);
        } else {
           resolvedImportOldPath = path.resolve(path.dirname(filePath), importPath + '.js');
        }
        resolvedImportOldPath = resolvedImportOldPath.replace(/\\/g, '/');
        
        if (fileMap[resolvedImportOldPath]) {
            modified = true;
            let newImport = path.relative(path.dirname(filePath), fileMap[resolvedImportOldPath]).replace(/\\/g, '/');
            if (!newImport.startsWith('.')) newImport = './' + newImport;
            if (!importPath.endsWith('.js')) newImport = newImport.replace(/\.js$/, '');
            return `from "${newImport}"`;
        }
        return match;
    });

    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]/g;
    content = content.replace(dynamicImportRegex, (match, importPath) => {
        if (!importPath.startsWith('.')) return match;
        
        let resolvedImportOldPath;
        if (importPath.endsWith('.js') || importPath.endsWith('.jsx')) {
           resolvedImportOldPath = path.resolve(path.dirname(filePath), importPath);
        } else {
           resolvedImportOldPath = path.resolve(path.dirname(filePath), importPath + '.js'); 
        }
        resolvedImportOldPath = resolvedImportOldPath.replace(/\\/g, '/');
        
        if (fileMap[resolvedImportOldPath]) {
            modified = true;
            let newImport = path.relative(path.dirname(filePath), fileMap[resolvedImportOldPath]).replace(/\\/g, '/');
            if (!newImport.startsWith('.')) newImport = './' + newImport;
            if (!importPath.endsWith('.js')) newImport = newImport.replace(/\.js$/, '');
            return `import("${newImport}"`;
        }
        return match;
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated paths in ${filePath}`);
    }
}

processDir(srcDir);

for (const [oldName, newRelPath] of Object.entries(fileMoves)) {
    const oldPath = path.join(qbDir, oldName);
    const newPath = path.join(qbDir, newRelPath);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${oldName} to ${newRelPath}`);
    }
}
