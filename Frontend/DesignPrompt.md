請你根據design.md的規範，並遵循以下指令：

1. 在主頁面homeScreen.tsx中，點擊`Draw a chunk`按鈕後，會彈出一個chunkcard，其中包含了Phrase card和Fill in the blank，我認為在這裡不需要Fill in the blank部分，反而可以把Fill in the blank部分單獨做在一個頁面上，因此可以保留Fill in the blank代碼，但是這個頁面不需要顯示Fill in the Blank了。當點擊`Draw a chunk`按鈕後，彈出Phrase card，並且phrase card下面有兩個按鈕，一個是退出按鈕，點擊後恢復原本的homescreen頁面；一個是`Next chunk`按鈕，點擊後可以轉到下一個phrase。當學習了一個phrase card後並點擊`Next chunk`按鈕，判定為學習進度增加+1，當學習進度等於goal-1，則下面的兩個按鈕變成新的兩個按鈕，分別為完成今日學習按鈕（要英文字），以及繼續學習按鈕（要英文字）。如果點擊繼續學習按鈕，則會繼續彈出Phrase card，直到goal的倍數-1時，再次彈出完成今日學習按鈕，以及繼續學習按鈕。

2. 在主頁面homeScreen.tsx中有一個`Daily Progress`的ProgressBar組件,這個組件現在的數值是硬編碼狀態，恆定value值為8。我們需要將這部分改成，當用戶每學習一個chunk，也就是點擊Next chunk後，進度+1，progressBar的進度條增加，直到等於最大值，就不再增加。為了方便測試，當點擊其他頁面後，再點擊會homeScreen後，進度條清零。原始進度條為0。

3. 在主頁面homeScreen.tsx中有EmptyState組件，EmptyState組件中有stat row。

其中一個是顯示學習了多少個chunks（{ icon: "📚", value: "47", label: "Learned" }），我需要把它改成可點擊的組件，點擊後可轉移到libraryScreen頁面。
接著把LibraryScreen頁面的`My Chunks`改成`一共學習到了_chunks!`,其中_部分則是顯示用戶學習到了的chunks數量。下方的{chunks.length} collected ·{" "}{chunks.filter((c) => c.mastered).length} mastered去除。

接著，還有一個是顯示連勝了多少日{ icon: "🔥", value: "12", label: "Day Streak" }，我需要把它改成可點擊的組件，點擊後可轉移到streakScreen頁面。

還有一個是顯示掌握了多少個chunks（{ icon: "🏅", value: "3", label: "Mastered" }）,我需要把它改成可點擊的組件，點擊後可轉移到MasteredScreen頁面。

4. 對於libraryScreen頁面，需要將`My Chunks`改成`一共學習到_chunks!`,其中_部分則是顯示用戶學習到了的chunks數量。平行於`一共學習到_chunks!`的右方放上一個適合的emoji；下方的{chunks.length} collected ·{" "}{chunks.filter((c) => c.mastered).length} mastered去除。

5. 對於streakScreen頁面，這是個未被實現的頁面，因此需要現在被實現。這個頁面顯示時不會有TabBar在底下。
在streakScreen畫面中,左上角有左箭頭icon按鈕為`退出按鈕`，點擊可以退回上一個畫面；平行於退出按鈕的置中區域顯示頁面標題`Streak`，表明所在頁面。
然後往下，是連勝日數顯示區域，在該區域中的左方顯示`x day Streak!`，其中x是連勝日數（目前可以硬編碼），`x`要在`day Streak!`上方，x要加大加粗，顏色為#FF9600；在該區域的右方弄一個平行於`x day Streak!`的🔥emoji，高度與左方的`x day Streak!`相同。
再往下是一張卡片，卡片圓角設計，從左開始放入組件，首先是一個大🔥emoji，接著在右方24px放入句子`Keep your Perfect Streak flame by doing a lesson every day!`,這段句子會佔兩行，高度要與🔥emoji相同。句子中的`Perfect Streak flame`要用#FF9600顏色。
再往下是兩張平行的卡片，兩張卡片寬度相同，左方卡片中，首先是有🔥emoji，與卡片左邊距差16px，上方邊距為8px，🔥emoji底部觸及卡片y軸中間位置，右方是總共學習數量x，x下方有一行更小的字`Total Practiced`;而在右方的卡片也是一樣，但是數字為今日學習chunks數量，下方的字為`Day Practiced`。
在兩張卡片下方，是月視圖日曆元件區域，日曆區域上方導欄的左邊是左右箭頭按鈕，用於往前和往後月份；中間部分是月份年份；右邊有一個Today按鈕，可直接回到當日的日曆位置。下方是週列表頭（Sun, Mon...），再下方是日期；如果該日完成了Day Practiced，則該日背景顏色變為#58CC02；每個完成的日期是一個 Full Rounded (正圓形)，前後兩個圓形之間用一條 Thin Horizontal Bar (細水平橫槓) 連接。

6. 對於MasteredScreen頁面，該頁面與libraryScreen頁面佈局相同，不同的是沒有頂部的Header，頂部的左方是左箭頭退出按鈕，用於退回上一個頁面；下方則是`一共掌握到_chunks!`，並在平行於`一共學習到了_chunks!`的右方提供適合的emoji；其他部分與libraryScreen相同。


