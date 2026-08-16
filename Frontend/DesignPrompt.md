請你根據design.md的規範，並遵循以下指令：

1. 目前我們有一個SettingScreen頁面，這個頁面可以在TabBar點擊icon跳轉；但是我現在想要把這個icon換成個人資料頁面；

2. 個人資料頁面是新的頁面，首先上方三分之一是#58CC02綠色背景，其餘下方則是資料區域；在背景區域的底部與資料區域頂部的中間交界區域，置中放置一個圓形頭像區域顯示頭像；頭像下方則是用戶名稱，用戶名稱下方放置SettingsScreen頁面的THIS WEEK'S HABIT卡片，用於顯示用戶的本星期的連勝情況；在下方則是SettingScreen的Daily chunk goal卡片，可以選擇每日學習的數量，選擇後，DAILY PROGRESS的最大數量則按照這個數量選擇來顯示；在下方放置一個卡通餅狀圖，餅狀圖可以觀察：總共學習的chunks的種類分佈；掌握的chunks的種類分佈；筆記的chunks的種類分佈。因此餅狀圖部分可以選擇查看不同的分佈。默認是總共學習的種類分佈；個人資料頁面的右上角放置setting icon，點擊後能跳轉到setting頁面；

3. Setting頁面沿用原來的樣式，但是有修改。首先Header部分去除，取而代之的是退出按鈕，以及置中的Setting標題。Setting原有的Weekly habit grid、Stats row以及Daily goal stepper刪除，只留下Toggle preferences和App info；在Toggle preferences下方，App info的上方放置一個退出登錄按鈕，則會回到登錄界面，並把登錄狀態取消，需要重新登陸。

請在寫代碼的時候，考慮可維護性，將一些複雜的組件打包成可複用的文件，如果有可複用的組件，優先使用。


