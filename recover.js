const fs = require('fs');
const readline = require('readline');

const transcriptPath = '/Users/prashantsingh/.gemini/antigravity-ide/brain/2982a178-39ed-4ddf-b6c2-bc366bc0c2a2/.system_generated/logs/transcript_full.jsonl';
const targetPrefix = '/Users/prashantsingh/Downloads/BackendProject.Scatch-main copy/';

async function recover() {
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls) {
                for (const call of entry.tool_calls) {
                    if (call.name === 'default_api:write_to_file') {
                        const args = call.arguments;
                        if (args.TargetFile && args.TargetFile.startsWith(targetPrefix)) {
                            // Write file
                            const dir = args.TargetFile.substring(0, args.TargetFile.lastIndexOf('/'));
                            fs.mkdirSync(dir, { recursive: true });
                            fs.writeFileSync(args.TargetFile, args.CodeContent);
                            console.log(`Wrote ${args.TargetFile}`);
                        }
                    } else if (call.name === 'default_api:multi_replace_file_content') {
                        const args = call.arguments;
                        if (args.TargetFile && args.TargetFile.startsWith(targetPrefix)) {
                            if (fs.existsSync(args.TargetFile)) {
                                let content = fs.readFileSync(args.TargetFile, 'utf8');
                                for (const chunk of args.ReplacementChunks) {
                                    if (content.includes(chunk.TargetContent)) {
                                        content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
                                    }
                                }
                                fs.writeFileSync(args.TargetFile, content);
                                console.log(`Modified ${args.TargetFile}`);
                            }
                        }
                    } else if (call.name === 'default_api:run_command') {
                        const args = call.arguments;
                        // Handle rm -rf backend/views
                        if (args.CommandLine && args.CommandLine.includes('rm -rf backend/views')) {
                            console.log(`Ran command: ${args.CommandLine}`);
                            const { execSync } = require('child_process');
                            try {
                                execSync(args.CommandLine, { cwd: args.Cwd });
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (e) {}
    }
}

recover();
