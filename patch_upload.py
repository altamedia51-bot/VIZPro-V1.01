with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_code = """                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Tambah Icon / Sticker</h2>
                  <label className="flex items-center gap-2 cursor-pointer group">"""

new_code = """                <div className="mb-6">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    id="image-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        const img = new Image();
                        img.onload = () => {
                          const isAutoText = (document.getElementById('auto-text-checkbox') as HTMLInputElement)?.checked ?? true;
                          const imageId = crypto.randomUUID();
                          const groupId = isAutoText ? crypto.randomUUID() : undefined;
                          
                          // Default max dimension to 200px
                          let targetWidth = img.width;
                          let targetHeight = img.height;
                          const MAX_SIZE = 200;
                          
                          if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
                            if (targetWidth > targetHeight) {
                                targetHeight = targetHeight * (MAX_SIZE / targetWidth);
                                targetWidth = MAX_SIZE;
                            } else {
                                targetWidth = targetWidth * (MAX_SIZE / targetHeight);
                                targetHeight = MAX_SIZE;
                            }
                          }
                          
                          const newElImage: any = {
                            id: imageId,
                            type: 'image',
                            src: url,
                            x: isAutoText ? 640 - 80 : 640,
                            y: 360,
                            scale: 1,
                            rotation: 0,
                            opacity: 1,
                            width: targetWidth,
                            height: targetHeight,
                            groupId
                          };
                          const newElements = [newElImage];
                          if (isAutoText) {
                            const textId = crypto.randomUUID();
                            const newElText: any = {
                              id: textId,
                              type: 'text',
                              text: 'Custom Logo',
                              x: 640 + 80,
                              y: 360,
                              scale: 1,
                              rotation: 0,
                              color: '#ffffff',
                              opacity: 1,
                              fontSize: 48,
                              fontFamily: 'Inter',
                              groupId
                            };
                            newElements.push(newElText);
                          }
                          setProject(p => ({ ...p, elements: [...p.elements, ...newElements] }));
                          setSelectedElementId(newElImage.id);
                        };
                        img.src = url;
                      }
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="w-full py-3 bg-[#1A1A1A] border border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500 text-blue-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ImageIcon size={16} /> UPLOAD GAMBAR / LOGO STATIS
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Tambah Icon / Sticker</h2>
                  <label className="flex items-center gap-2 cursor-pointer group">"""

content = content.replace(old_code, new_code)
with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
