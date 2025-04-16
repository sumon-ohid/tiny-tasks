              <EmojiPicker 
                onSelect={setEmoji} 
                currentEmoji={emoji ? {
                  url: emoji.url,
                  style: emoji.style || 'adventurer-neutral',
                  seed: emoji.seed || 1,
                  bgColor: undefined
                } : null}
              /> 