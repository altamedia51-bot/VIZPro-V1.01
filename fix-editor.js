import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

// The error is caused by a syntax error in the JSX because we appended a rogue </div>
// Let's find the specific block and fix it.
const regex = /<div className="hidden">([\s\S]*?)<\/div>\n<\/div>\n                      <\/div>\n                    \)}/;

if (regex.test(code)) {
    code = code.replace(regex, '$1\n                      </div>\n                    )}');
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Syntax fixed");
} else {
    // alternative simple fix for JSX syntax
    const badStr = `</div></div>\n                        </div>\n                      )}`;
    const goodStr = `</div>\n                      </div>\n                    )}`;
    if (code.includes(badStr)) {
        code = code.replace(badStr, goodStr);
        fs.writeFileSync('src/components/Editor.tsx', code);
        console.log("Syntax fixed via alternative");
    }
}
