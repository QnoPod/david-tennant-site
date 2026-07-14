import type { EpisodeAppearance } from "../lib/types";

/**
 * TMDBで具体的な出演回を取得できないTV作品の補完データです。
 * シーズン・話数まで確認できた作品だけを記載します。
 * 俳優・声優としての出演に加え、本人出演のトーク番組・バラエティ・授賞式も対象です。
 * 授賞式のようにシーズン・話数を持たない番組はdisplayLabelで「第○回」と表示します。
 * キーには原題を使い、作品詳細ではTMDBの日本語名と原題の両方を照合します。
 */
export const episodeOverrides: Record<string, EpisodeAppearance[]> = {
  "Dramarama": [{ seasonNumber: 6, episodeNumber: 13, title: "The Secret of Croftmore", originalTitle: "The Secret of Croftmore", airDate: "1988-08-08", character: "Neil McDonald" }],
  "The Play on One": [{ seasonNumber: 2, episodeNumber: 8, title: "Biting the Hands", originalTitle: "Biting the Hands", airDate: "1989-04-11", character: "Third Squaddie" }],
  "Strathblair": [{ seasonNumber: 1, episodeNumber: 2, title: "Family Affairs", originalTitle: "Family Affairs", airDate: "1992-05-10", character: "Archie the Hiker" }],
  "Bunch of Five": [{ seasonNumber: 1, episodeNumber: 5, title: "Miles Better", originalTitle: "Miles Better", airDate: "1992-07-01", character: "Policeman" }],
  "Rab C. Nesbitt": [{ seasonNumber: 3, episodeNumber: 2, title: "Touch", originalTitle: "Touch", airDate: "1993-11-25", character: "Davina" }],
  "The Tales of Para Handy": [{ seasonNumber: 2, episodeNumber: 2, title: "Para Handy's Piper", originalTitle: "Para Handy's Piper", airDate: "1995-08-07", character: "John MacBryde" }],
  "The Bill": [{ seasonNumber: 11, episodeNumber: 128, title: "Deadline", originalTitle: "Deadline", airDate: "1995-11-08", character: "Steven Clemens" }],
  "A Mug's Game": [{ seasonNumber: 1, episodeNumber: 2, title: "Episode 2", originalTitle: "Episode 2", character: "Gavin" }],
  "Holding the Baby": [{ seasonNumber: 1, episodeNumber: 2, title: "Sickness", originalTitle: "Sickness", airDate: "1997-01-31", character: "Nurse" }],
  "Conjuring Shakespeare": [{ seasonNumber: 1, episodeNumber: 6, title: "Like a Virgin", originalTitle: "Like a Virgin", airDate: "1997-10-15", character: "Angelo" }],
  "Love in the 21st Century": [{ seasonNumber: 1, episodeNumber: 1, title: "Reproduction", originalTitle: "Reproduction", airDate: "1999-07-21", character: "John" }],
  "The Mrs Bradley Mysteries": [{ seasonNumber: 1, episodeNumber: 1, title: "Death at the Opera", originalTitle: "Death at the Opera", airDate: "2000-01-16", character: "Max Valentine" }],
  "Randall & Hopkirk (Deceased)": [{ seasonNumber: 1, episodeNumber: 1, title: "Drop Dead", originalTitle: "Drop Dead", airDate: "2000-03-18", character: "Gordon Stylus" }],
  "People Like Us": [{ seasonNumber: 2, episodeNumber: 4, title: "The Actor", originalTitle: "The Actor", airDate: "2001-06-10", character: "Rob Harker" }],
  "High Stakes": [{ seasonNumber: 1, episodeNumber: 5, title: "The Magic Word", originalTitle: "The Magic Word", airDate: "2001-05-20", character: "Gaz Whitney" }],
  "Foyle's War": [{ seasonNumber: 1, episodeNumber: 3, title: "A Lesson in Murder", originalTitle: "A Lesson in Murder", airDate: "2002-11-10", character: "Theo Howard" }],
  "Trust": [{ seasonNumber: 1, episodeNumber: 6, title: "Episode 6", originalTitle: "Episode 6", airDate: "2003-02-13", character: "Gavin MacEwan" }],
  "Posh Nosh": [
    { seasonNumber: 1, episodeNumber: 3, title: "Paella", originalTitle: "Paella", airDate: "2003-02-18", character: "José Luis" },
    { seasonNumber: 1, episodeNumber: 8, title: "Comfort Food", originalTitle: "Comfort Food", airDate: "2003-04-22", character: "José Luis / New Tennis Coach" },
  ],
  "Terri McIntyre": [
    { seasonNumber: 2, episodeNumber: 1, title: "Model", originalTitle: "Model", airDate: "2003-09-22", character: "Greig Miller" },
    { seasonNumber: 2, episodeNumber: 2, title: "Shamed", originalTitle: "Shamed", airDate: "2003-09-29", character: "Greig Miller" },
    { seasonNumber: 2, episodeNumber: 3, title: "Dick", originalTitle: "Dick", airDate: "2003-10-06", character: "Greig Miller" },
    { seasonNumber: 2, episodeNumber: 4, title: "Thong", originalTitle: "Thong", airDate: "2003-10-13", character: "Greig Miller" },
    { seasonNumber: 2, episodeNumber: 5, title: "Blaze", originalTitle: "Blaze", airDate: "2003-10-20", character: "Greig Miller" },
    { seasonNumber: 2, episodeNumber: 6, title: "Wave", originalTitle: "Wave", airDate: "2003-10-27", character: "Greig Miller" },
  ],
  "Spine Chillers": [{ seasonNumber: 1, episodeNumber: 1, title: "Bradford in My Dreams", originalTitle: "Bradford in My Dreams", airDate: "2003-06-23", character: "Dr. Krull" }],
  "Doctor Who: Scream of the Shalka": [{ seasonNumber: 1, episodeNumber: 5, title: "Episode 5", originalTitle: "Episode 5", airDate: "2003-12-11", character: "Warehouseman" }],
  "The Romantics": [{ seasonNumber: 1, episodeNumber: 1, title: "Liberty", originalTitle: "Liberty", airDate: "2006-01-21", character: "Jean-Jacques Rousseau" }],
  "Dead Ringers": [{ seasonNumber: 7, episodeNumber: 6, title: "Episode 6", originalTitle: "Episode 6", airDate: "2007-03-29", character: "Regenerated Tony Blair" }],
  "Extras": [{ seasonNumber: 2, episodeNumber: 7, title: "The Extra Special Series Finale", originalTitle: "The Extra Special Series Finale", airDate: "2007-12-27", character: "本人" }],
  "The Sarah Jane Adventures": [
    { seasonNumber: 3, episodeNumber: 5, title: "The Wedding of Sarah Jane Smith: Part One", originalTitle: "The Wedding of Sarah Jane Smith: Part One", airDate: "2009-10-29", character: "The Doctor" },
    { seasonNumber: 3, episodeNumber: 6, title: "The Wedding of Sarah Jane Smith: Part Two", originalTitle: "The Wedding of Sarah Jane Smith: Part Two", airDate: "2009-10-30", character: "The Doctor" },
  ],
  "The Catherine Tate Show: Nan's Christmas Carol": [{ seasonNumber: 0, episodeNumber: 1, title: "Nan's Christmas Carol", originalTitle: "Nan's Christmas Carol", airDate: "2009-12-25", character: "Ghost of Christmas Present" }],
  "Playhouse Presents": [{ seasonNumber: 1, episodeNumber: 1, title: "The Minor Character", originalTitle: "The Minor Character", airDate: "2012-04-12", character: "Will" }],
  "True Love": [{ seasonNumber: 1, episodeNumber: 1, title: "Nick", originalTitle: "Nick", airDate: "2012-06-17", character: "Nick" }],
  "Star Wars: The Clone Wars": [
    { seasonNumber: 5, episodeNumber: 7, title: "A Test of Strength", originalTitle: "A Test of Strength", airDate: "2012-11-10", character: "Huyang" },
    { seasonNumber: 5, episodeNumber: 8, title: "Bound for Rescue", originalTitle: "Bound for Rescue", airDate: "2012-11-17", character: "Huyang" },
    { seasonNumber: 5, episodeNumber: 9, title: "A Necessary Bond", originalTitle: "A Necessary Bond", airDate: "2012-11-24", character: "Huyang" },
  ],
  "This Is Jinsy": [{ seasonNumber: 1, episodeNumber: 1, title: "Wedding Lottery", originalTitle: "Wedding Lottery", airDate: "2011-09-19", character: "Mr Slightlyman" }],
  "Jake and the Never Land Pirates": [
    { seasonNumber: 3, episodeNumber: 32, title: "Dread the Evil Genie / Sandblast!", originalTitle: "Dread the Evil Genie / Sandblast!", airDate: "2015-07-06", character: "Dread the Evil Genie" },
    { seasonNumber: 4, episodeNumber: 9, title: "Dread the Pharaoh! / Sharky Unchained!", originalTitle: "Dread the Pharaoh! / Sharky Unchained!", airDate: "2016-03-07", character: "Dread the Evil Genie" },
  ],
  "Mickey Mouse Clubhouse": [{ seasonNumber: 4, episodeNumber: 20, title: "Mickey's Monster Musical", originalTitle: "Mickey's Monster Musical", airDate: "2015-10-09", character: "Igor the Door" }],
  "Have I Got News for You": [
    { seasonNumber: 50, episodeNumber: 5, title: "Episode 5", originalTitle: "Episode 5", airDate: "2015-10-30", character: "Guest Host" },
    { seasonNumber: 51, episodeNumber: 5, title: "Episode 5", originalTitle: "Episode 5", airDate: "2016-05-06", character: "Guest Host" },
    { seasonNumber: 54, episodeNumber: 10, title: "Episode 10", originalTitle: "Episode 10", airDate: "2017-12-15", character: "Guest Host" },
    { seasonNumber: 56, episodeNumber: 6, title: "Episode 6", originalTitle: "Episode 6", airDate: "2018-11-09", character: "Guest Host" },
    { seasonNumber: 57, episodeNumber: 4, title: "Episode 4", originalTitle: "Episode 4", airDate: "2019-04-26", character: "Guest Host" },
    { seasonNumber: 59, episodeNumber: 6, title: "Episode 6", originalTitle: "Episode 6", airDate: "2020-05-07", character: "Guest Host" },
    { seasonNumber: 61, episodeNumber: 1, title: "Episode 1", originalTitle: "Episode 1", airDate: "2021-04-12", character: "Guest Host" },
    { seasonNumber: 65, episodeNumber: 2, title: "Episode 2", originalTitle: "Episode 2", airDate: "2023-04-21", character: "Guest Host" },
    { seasonNumber: 69, episodeNumber: 6, title: "Episode 6", originalTitle: "Episode 6", airDate: "2025-05-09", character: "Guest Host" },
    { seasonNumber: 71, episodeNumber: 10, title: "Episode 10", originalTitle: "Episode 10", airDate: "2026-06-05", character: "Guest Host" },
  ],
  // 本人出演のトーク・バラエティ番組。再編集だけの総集編は含めません。
  "The Graham Norton Show": [
    { seasonNumber: 1, episodeNumber: 6, title: "David Tennant, Jo Brand, The Proclaimers", originalTitle: "David Tennant, Jo Brand, The Proclaimers", airDate: "2007-03-29", character: "本人（ゲスト）" },
    { seasonNumber: 6, episodeNumber: 6, title: "David Tennant, Johnny Vegas, Alison Moyet", originalTitle: "David Tennant, Johnny Vegas, Alison Moyet", airDate: "2009-11-09", character: "本人（ゲスト）" },
    { seasonNumber: 9, episodeNumber: 1, title: "David Tennant, Catherine Tate, Jon Richardson, Josh Groban", originalTitle: "David Tennant, Catherine Tate, Jon Richardson, Josh Groban", airDate: "2011-04-15", character: "本人（ゲスト）" },
    { seasonNumber: 14, episodeNumber: 6, title: "Emma Thompson, David Tennant, Matt Smith, Robbie Williams, Jimmy Carr", originalTitle: "Emma Thompson, David Tennant, Matt Smith, Robbie Williams, Jimmy Carr", airDate: "2013-11-22", character: "本人（ゲスト）" },
    { seasonNumber: 16, episodeNumber: 15, title: "David Tennant, Olivia Colman, Harvey Weinstein, Jessie J", originalTitle: "David Tennant, Olivia Colman, Harvey Weinstein, Jessie J", airDate: "2015-01-16", character: "本人（ゲスト）" },
    { seasonNumber: 23, episodeNumber: 7, title: "Emilia Clarke, David Tennant, Gloria Estefan, Phoebe Waller-Bridge, Leon Bridges", originalTitle: "Emilia Clarke, David Tennant, Gloria Estefan, Phoebe Waller-Bridge, Leon Bridges", airDate: "2018-05-18", character: "本人（ゲスト）" },
    { seasonNumber: 25, episodeNumber: 9, title: "Gloria Estefan, Chris Hemsworth, David Tennant, Michael Sheen, Jonas Brothers", originalTitle: "Gloria Estefan, Chris Hemsworth, David Tennant, Michael Sheen, Jonas Brothers", airDate: "2019-05-31", character: "本人（ゲスト）" },
    { seasonNumber: 28, episodeNumber: 11, title: "George Clooney, Michael Sheen, David Tennant, Viola Davis, Vanessa Kirby", originalTitle: "George Clooney, Michael Sheen, David Tennant, Viola Davis, Vanessa Kirby", airDate: "2020-12-18", character: "本人（ゲスト）" },
    { seasonNumber: 30, episodeNumber: 1, title: "Eric Idle, Jamie Lee Curtis, David Tennant, Lydia West, Robbie Williams", originalTitle: "Eric Idle, Jamie Lee Curtis, David Tennant, Lydia West, Robbie Williams", airDate: "2022-09-30", character: "本人（ゲスト）" },
  ],
  "The Last Leg": [
    { seasonNumber: 10, episodeNumber: 1, title: "Episode One", originalTitle: "Episode One", airDate: "2017-01-27", character: "本人（ゲスト）" },
    { seasonNumber: 13, episodeNumber: 1, title: "Episode One", originalTitle: "Episode One", airDate: "2018-01-26", character: "本人（ゲスト）" },
    { seasonNumber: 14, episodeNumber: 7, title: "Episode Seven", originalTitle: "Episode Seven", airDate: "2018-08-03", character: "本人（ゲスト）" },
    { seasonNumber: 19, episodeNumber: 2, title: "Episode Two", originalTitle: "Episode Two", airDate: "2020-01-24", character: "本人（ゲスト）" },
    { seasonNumber: 22, episodeNumber: 3, title: "Episode Three", originalTitle: "Episode Three", airDate: "2021-06-18", character: "本人（ゲスト）" },
    { seasonNumber: 27, episodeNumber: 2, title: "Episode Two", originalTitle: "Episode Two", airDate: "2023-02-03", character: "本人（ゲスト）" },
    { seasonNumber: 29, episodeNumber: 2, title: "Episode Two", originalTitle: "Episode Two", airDate: "2023-11-17", character: "本人（ゲスト）" },
  ],
  "The Jonathan Ross Show": [
    { seasonNumber: 4, episodeNumber: 1, title: "Jeremy Piven, Sarah Millican, David Tennant, Phil Taylor", originalTitle: "Jeremy Piven, Sarah Millican, David Tennant, Phil Taylor", airDate: "2013-01-05", character: "本人（ゲスト）" },
    { seasonNumber: 9, episodeNumber: 5, title: "Cristiano Ronaldo, David Tennant, Agyness Deyn", originalTitle: "Cristiano Ronaldo, David Tennant, Agyness Deyn", airDate: "2015-11-14", character: "本人（ゲスト）" },
    { seasonNumber: 15, episodeNumber: 15, title: "The Jonathan Ross Christmas Show", originalTitle: "The Jonathan Ross Christmas Show", airDate: "2019-12-24", character: "本人（ゲスト）" },
  ],
  // 年次授賞式は放送回をdisplayLabelで示し、出演時の役割も明記します。
  "National Television Awards": [
    { seasonNumber: 20, episodeNumber: 1, displayLabel: "第20回", title: "20th National Television Awards", originalTitle: "20th National Television Awards", airDate: "2015-01-21", character: "本人（特別表彰受賞者）" },
  ],
  "The British Academy Film Awards": [
    { seasonNumber: 77, episodeNumber: 1, displayLabel: "第77回", title: "2024 EE BAFTA Film Awards", originalTitle: "77th British Academy Film Awards", airDate: "2024-02-18", character: "司会" },
    { seasonNumber: 78, episodeNumber: 1, displayLabel: "第78回", title: "2025 EE BAFTA Film Awards", originalTitle: "78th British Academy Film Awards", airDate: "2025-02-16", character: "司会" },
  ],
  "EE BAFTA Film Awards": [
    { seasonNumber: 77, episodeNumber: 1, displayLabel: "第77回", title: "2024 EE BAFTA Film Awards", originalTitle: "77th British Academy Film Awards", airDate: "2024-02-18", character: "司会" },
    { seasonNumber: 78, episodeNumber: 1, displayLabel: "第78回", title: "2025 EE BAFTA Film Awards", originalTitle: "78th British Academy Film Awards", airDate: "2025-02-16", character: "司会" },
  ],
  "Family Guy": [{ seasonNumber: 15, episodeNumber: 4, title: "Inside Family Guy", originalTitle: "Inside Family Guy", airDate: "2016-10-23", character: "Tenth Doctor" }],
  "Thunderbirds Are Go!": [{ seasonNumber: 2, episodeNumber: 25, title: "Hyperspeed", originalTitle: "Hyperspeed", airDate: "2017-12-09", character: "Tycho Reeves" }],
  "Hang Ups": [{ seasonNumber: 1, episodeNumber: 2, title: "Episode 2", originalTitle: "Episode 2", airDate: "2018-08-15", character: "Martin Lamb" }],
  "Criminal: UK": [{ seasonNumber: 1, episodeNumber: 1, title: "エドガー", originalTitle: "Edgar", airDate: "2019-09-20", character: "Dr. Edgar Fallon" }],
  "Meet the Richardsons": [
    { seasonNumber: 3, episodeNumber: 1, title: "Episode 1", originalTitle: "Episode 1", airDate: "2022-03-03", character: "本人" },
    { seasonNumber: 3, episodeNumber: 8, title: "Episode 8", originalTitle: "Episode 8", airDate: "2022-04-21", character: "本人" },
  ],
  "The Legend of Vox Machina": [
    { seasonNumber: 1, episodeNumber: 1, title: "The Terror of Tal'Dorei - Part 1", originalTitle: "The Terror of Tal'Dorei - Part 1", airDate: "2022-01-28", character: "General Krieg / Brimscythe" },
    { seasonNumber: 1, episodeNumber: 2, title: "The Terror of Tal'Dorei - Part 2", originalTitle: "The Terror of Tal'Dorei - Part 2", airDate: "2022-01-28", character: "General Krieg / Brimscythe" },
  ],
  "The Sandman": [{ seasonNumber: 1, episodeNumber: 11, title: "A Dream of a Thousand Cats / Calliope", originalTitle: "A Dream of a Thousand Cats / Calliope", airDate: "2022-08-19", character: "Don" }],
  "Clone High": [{ seasonNumber: 2, episodeNumber: 6, title: "Saved by the Knoll", originalTitle: "Saved by the Knoll", airDate: "2023-06-08", character: "本人" }],
  "The Simpsons": [{ seasonNumber: 35, episodeNumber: 8, title: "Ae Bonny Romance", originalTitle: "Ae Bonny Romance", airDate: "2023-12-03", character: "Pa MacWeldon" }],
  "Marvel's Moon Girl and Devil Dinosaur": [{ seasonNumber: 2, episodeNumber: 10, title: "Dog Day Mid-Afternoon", originalTitle: "Dog Day Mid-Afternoon", airDate: "2024-02-03", character: "Franklin" }],
  "ARK: The Animated Series": [
    { seasonNumber: 1, episodeNumber: 1, title: "Element 1", originalTitle: "Element 1", airDate: "2024-03-21", character: "Sir Edmund Rockwell" },
    { seasonNumber: 1, episodeNumber: 5, title: "Element 5", originalTitle: "Element 5", airDate: "2024-03-21", character: "Sir Edmund Rockwell" },
    { seasonNumber: 1, episodeNumber: 6, title: "Element 6", originalTitle: "Element 6", airDate: "2024-03-21", character: "Sir Edmund Rockwell" },
  ],
  "Star Wars: Young Jedi Adventures": [{ seasonNumber: 2, episodeNumber: 4, title: "Nubs' Big Mistake / The Jedi Rescue", originalTitle: "Nubs' Big Mistake / The Jedi Rescue", airDate: "2024-08-14", character: "Huyang" }],
  "Chibiverse": [{ seasonNumber: 3, episodeNumber: 1, title: "Grown Ups Island / Opposites Attack / Stan's 11", originalTitle: "Grown Ups Island / Opposites Attack / Stan's 11", airDate: "2025-01-18", character: "Scrooge McDuck" }],
  "The Assembly": [
    { seasonNumber: 1, episodeNumber: 2, title: "David Tennant", originalTitle: "David Tennant", airDate: "2025-04-27", character: "本人" },
    { seasonNumber: 1, episodeNumber: 5, title: "The Assembly: Unseen", originalTitle: "The Assembly: Unseen", airDate: "2025-05-18", character: "本人" },
  ],
  "Big City Greens": [{ seasonNumber: 4, episodeNumber: 24, title: "Saxon Saxability / Remy Dillemy", originalTitle: "Saxon Saxability / Remy Dillemy", airDate: "2025-06-28", character: "Lord Argyle" }],
  "Marvel's Spidey and His Amazing Friends": [{ seasonNumber: 4, episodeNumber: 19, title: "The Return of Web-Beard / Sandman vs Hydro-Man", originalTitle: "The Return of Web-Beard / Sandman vs Hydro-Man", airDate: "2026-01-10", character: "Captain Web-Beard" }],
  "The Four Seasons": [{ seasonNumber: 2, episodeNumber: 8, title: "Maratona", originalTitle: "Maratona", airDate: "2026-05-28", character: "Gianpiero" }],
};
