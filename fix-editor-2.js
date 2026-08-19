import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

// I accidentally injected a malformed closing div earlier. Let's fix lines 1640-1660
const regex = /<\/div><\/div>\n                      <\/div>\n                    \)}/;
if (regex.test(code)) {
    code = code.replace(regex, '</div>\n                      </div>\n                    )}');
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Syntax fixed correctly");
} else {
    // If we can't find it, we'll just download a backup if possible, but let's try broader replacement
    const idx = code.indexOf(`</div></div>\n                      </div>\n                    )}`);
    if(idx !== -1) {
        code = code.substring(0, idx) + `</div>\n                      </div>\n                    )}` + code.substring(idx + 44);
        fs.writeFileSync('src/components/Editor.tsx', code);
        console.log("Syntax fixed broadly");
    }
}

