const { spawn } = require('child_process');
const p = spawn('npx', ['prisma', 'migrate', 'dev', '--name', 'finalize_migration'], { shell: true });
p.stdout.on('data', d => {
    const str = d.toString();
    console.log(str);
    if (str.includes('We need to reset') || str.includes('Do you want to continue')) {
        p.stdin.write('y\n');
    }
});
p.stderr.on('data', d => {
    console.error(d.toString());
});
p.on('close', code => process.exit(code));
