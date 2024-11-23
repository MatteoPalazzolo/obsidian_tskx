import { Notice } from 'obsidian';
import { exec } from 'child_process';
import * as moment from 'moment';

export async function gitPush(): Promise<boolean> {
    
    const todayDate = moment.utc().format('DD/MM/YYYY');

    try {
        await runCommand('git add .');
        await runCommand(`git commit -m "${todayDate}"`);
        await runCommand('git push');
        new Notice('Git commit and push successful!');
    } catch (error) {
        new Notice(`Git operation failed: ${error.message}`);
        return false;
    }

    return true;
}

async function runCommand(command:string) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr.trim() || error.message));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}