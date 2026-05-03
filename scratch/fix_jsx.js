import fs from 'fs';

const filePath = 'client/src/pages/AdminBibliotheque.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The trace showed D1 (357) and N1 (491) are missing closures.
// In Medias tab:
// We need to add a </div> before the </TabsContent> that closes "medias".
// In Newsletter tab:
// We need to add a </div> before the </TabsContent> that closes "newsletter".

const lines = content.split('\n');
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const nextLine = lines[i+1] || "";
  
  // Look for the end of Medias tab
  if (line.includes('galleryData?.items.map') && lines[i+29]?.includes('</TabsContent>')) {
     // This is too fragile.
  }
  
  newLines.push(line);
}

// Let's try a simpler string replacement if unique enough.
// Medias Tab end:
const mediasEndTarget = '                  </div>\n                </div>\n              </div>\n            </TabsContent>';
const mediasEndFix = '                  </div>\n                </div>\n              </div>\n            </div>\n          </TabsContent>';

// Newsletter Tab end:
const newsEndTarget = '                </div>\n              </div>\n            </TabsContent>';
const newsEndFix = '                </div>\n              </div>\n            </div>\n          </TabsContent>';

// Let's check if these targets exist
if (content.includes(mediasEndTarget)) {
    console.log("Found Medias target");
    content = content.replace(mediasEndTarget, mediasEndFix);
} else {
    console.log("Medias target NOT found");
}

if (content.includes(newsEndTarget)) {
    console.log("Found Newsletter target");
    content = content.replace(newsEndTarget, newsEndFix);
} else {
    console.log("Newsletter target NOT found");
}

fs.writeFileSync(filePath, content);
console.log("Done");
