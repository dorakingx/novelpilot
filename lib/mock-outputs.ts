import { buildCompleteManuscript } from "./format-manuscript";
import type { AgentId, ChapterDraft, ForeshadowingItem, Language } from "./types";

const DRAFTING_CHAPTERS_EN: ChapterDraft[] = [
  {
    number: 1,
    title: "Residual Noise",
    draft: `The notification arrived at 2:17 a.m., a polite chime that felt obscene against the lab's humming silence. MISSING PERSON — AYA MORI — LAST SEEN: DECOHERENCE CHAMBER B.

Ren stared at the screen until the letters blurred. Forty-eight hours, the message said, as if time were a substance you could measure in a beaker and pour away.

He did not remember yesterday. He did not remember whether he had eaten, or called his mother, or walked home under the vending-machine lights that always flickered on the annex's north side. What he had was a thin, reliable catalog of facts: his name, his department, the location of the men's restroom on the third floor. Everything else arrived in fragments — a woman's laugh, the scent of rain on heated pavement — without context, like debris washed up after a storm he could not name.

Ren stood. His locker door stuck, as it always did, and when it finally gave, something clattered to the tile. Safety goggles, lenses fogged from the inside as though someone had breathed a secret into them. He did not own goggles. He was not scheduled for Chamber B.

On his workstation, a new file pulsed: decoherence_log_4471.tmp. Ren opened it. Waveforms scrolled, beautiful and indifferent. Between them, in a margin note he did not remember writing, a line appeared in his own hand: *Don't trust the backup.*

He closed the file. The lab felt larger then, corridors stretching into fluorescent eternity. Somewhere, a centrifuge spun. Somewhere, Aya Mori was not.

Ren put the goggles in his pocket and went looking for a memory that would not admit whether it belonged to him.`,
  },
  {
    number: 2,
    title: "Calibration Ghost",
    draft: `By morning the security office smelled of burnt coffee and ozone. A timestamp glowed on the wall monitor: 02:14 — four minutes before the missing-person alert Ren had received in the dark.

"Your handwriting," Mika said. She did not look at him when she slid the printout across the desk. The calibration entries matched samples from his thesis notebooks down to the pressure of his pen.

Ren heard himself explain that handwriting could be forged, that logs could be injected, that anyone with admin access could wear his voice in the system. The words sounded borrowed.

"I saw you," Mika said quietly. "After hours. Tuesday. You were arguing with someone near Chamber B. I thought it was Aya."

Ren's throat tightened. He wanted to ask what they had argued about, but the question felt like pulling a thread that might unravel the whole sweater of his life.

In the archive room, footnotes in older logs resolved into a cipher when he held them at an angle — coordinates, not equations. A vending machine on the north annex corridor had accepted exact change at 01:58, a joke the lab used when someone bypassed the night lock.

He found the unlabeled memory card in his coat pocket, though he did not remember putting it there. When he pressed it to the reader, a faint pulse of audio breathed through the speaker: Aya's voice, one word, almost kind. "Listen."

Ren closed his eyes and listened, afraid the next word would be his own.`,
  },
  {
    number: 3,
    title: "Chamber B",
    draft: `The footage was worse than Ren had imagined and better than he had feared — worse because his face filled the frame at the chamber door; better because Aya walked beside him, alive, her hand on his sleeve as if she were guiding him through a ritual he had agreed to long ago.

Dr. Sato stood at the console without surprise. "You signed the consent form," she said. "You asked us to edit the traumatic interval. Aya volunteered to witness."

Ren remembered nothing — and yet the cherry blossom petal taped inside his locker, discovered only now, carried ink in Aya's hand: *If you forget, trust the witness, not the backup.*

The silver watch on the evidence table had cracked at 02:11. The minute hand pointed to the moment his memory had been overwritten — not stolen, he understood with a sick clarity, but curated, with his own signature at the bottom of the form he had begged for after the first collapse.

Mika waited in the corridor, arms folded. "What will you do?"

Ren looked at the live feed of Chamber B, empty now, humming. The lab had buried inconvenient data before. He could disappear into rationalization, or he could upload the raw logs to the faculty server and let the decoherence spread where it would.

He chose the upload. The progress bar crawled like a sunrise he did not deserve.

Outside, Tokyo rain glossed the pavement. Ren did not know if he was hero, victim, or accomplice — only that the story had to be whole, even if he was not. Somewhere, he hoped, Aya would read the truth and decide whether to come back.

The notification chimed again. Not missing persons. CONFIRMATION — DATA INTEGRITY REVIEW INITIATED. Ren exhaled, and for the first time in three days, the noise in his head felt like his own.`,
  },
];

const DRAFTING_CHAPTERS_JA: ChapterDraft[] = [
  {
    number: 1,
    title: "残留ノイズ",
    draft: `通知は午前2時17分に届いた。研究室の唸りを背にして、丁寧なチャイムが不条理に響く。行方不明 — 森 彩 — 最後の目撃：デコヒーレンス室B。

蓮は文字が滲むまで画面を見つめた。四十八時間、メッセージは言った。まるで時間はビーカーで測り、注いで捨てられる物質のように。

彼は昨日を覚えていない。食べたか、母に電話したか、別館北側でいつも明滅する自販機の灯りの下を歩いたか。手元にあるのは薄くて頼りになる事実の目録だけだった。名前、所属、三階男子トイレの場所。それ以外は断片として漂う。女の笑い声、熱したアスファルトの雨の匂い。嵐の名前も、文脈もない。

蓮は立った。ロッカーはいつも通り引っかかり、ようやく開いたとき、何かがタイルに落ちた。保護ゴーグル。内側のレンズは曇っていて、誰かが秘密を息で書いたかのようだった。彼はゴーグルを持っていない。室Bの予定もない。

ワークステーションに新しいファイルが脈打っていた。decoherence_log_4471.tmp。蓮は開いた。波形が流れ、美しく、無関心だった。そのあいだ、覚えのない手書きの注釈が、彼自身の筆跡で現れる。*バックアップを信じるな。*

ファイルを閉じた。研究室はそのとき大きくなった。廊下が蛍光灯の永遠へ伸びる。どこかで遠心分離機が回る。どこかで、森彩はいない。

蓮はゴーグルをポケットに入れ、自分のものかどうかも告げない記憶を探しに行った。`,
  },
  {
    number: 2,
    title: "校正の幽霊",
    draft: `朝、警備室は焦げたコーヒーとオゾンの匂いがした。壁のモニターにタイムスタンプ：02:14 — 蓮が夜中に受け取った失踪アラートの四分前。

「あなたの筆跡よ」と美香は言った。彼を見ずに印刷物を机に滑らせる。校正記録は論文ノートの筆圧まで一致していた。

蓮は声を出した。筆跡は偽造できる、ログは注入できる、管理者なら誰でも自分の声を着られる、と。言葉は借り物のように聞こえた。

「見たの」と美香は小声で言った。「深夜に。室Bの近くで誰かと言い争っていた。彩だと思った」

蓮の喉が狭くなった。何を争ったのか聞きたかったが、糸を引けば人生全体がほどける気がした。

アーカイブ室で、古いログの脚注を角度を変えると暗号のように座標が浮かぶ。別館北の自販機が01:58に釣り銭なしで動いた — 夜のロックを抜ける合図の冗談だった。

コートのポケットから無印のメモリーカードが出てきた。覚えはない。リーダーに当てると、スピーカーから微かな音：彩の声、一言、優しげに。「聞いて」

蓮は目を閉じて聞いた。次の言葉が自分のものであることを恐れながら。`,
  },
  {
    number: 3,
    title: "室B",
    draft: `映像は想像より残酷で、恐れよりは誠実だった — 残酷なのは、室Bのドア前に彼の顔が画面いっぱいにあったから。誠実なのは、彩が生きて歩き、彼の袖に手を置き、ずっと前から合意していた儀式のように導いていたからだ。

佐藤博士は驚かなかった。「同意書に署名したでしょう」と言った。「トラウマの区間を編集してほしいと頼んだ。彩が立会人になった」

蓮は何も思い出せない — それでもロッカー内の桜の花びらに、今ようやく気づいたインクの文字：彩の筆跡。*忘れたら、バックアップではなく立会人を信じて。*

証拠台の銀の懐中時計は02:11で割れていた。短針は記憶が上書きされた瞬間を指していた — 盗まれたのではなく、最初の崩壊のあと彼自身が懇願して署名したフォームの下で、選ばれたのだと、吐き気のする明晰さとともに理解した。

美香は廊下で腕を組んで待っていた。「どうする？」

蓮は空の室Bのライブ映像を見た。研究室は都合の悪いデータを埋めたことがある。合理化の中に消えるか、生ログを学部サーバに上げ、デコヒーレンスを広げるか。

上げることを選んだ。プログレスバーは望んでいない夜明けのように進んだ。

外は東京の雨が舗装を光らせた。蓮は自分が英雄か被害者か共犯かわからない — 物語だけは全体でなければならない、たとえ自分がそうでなくても。どこかで、彩が真実を読み、戻るか決めることを願った。

通知が再び鳴った。失踪ではない。確認 — データ整合性レビュー開始。蓮は息を吐き、三日ぶりに頭の中のノイズが自分のものに感じられた。`,
  },
];

const FORESHADOWING_TRACKER_EN: ForeshadowingItem[] = [
  {
    item: "The cracked silver watch",
    introducedIn: "Chapter 1",
    status: "unresolved",
    suggestedPayoff:
      "Reveals the exact minute the protagonist's memory was overwritten.",
    payoffChapter: "Chapter 3",
    emotionalPurpose: "Connects guilt, identity, and lost time.",
  },
  {
    item: "Unlabeled memory card",
    introducedIn: "Chapter 1",
    status: "unresolved",
    suggestedPayoff: "Contains Aya's farewell cipher and proof of consent fraud.",
    payoffChapter: "Chapter 2",
    emotionalPurpose: "Turns absence into an active clue.",
  },
  {
    item: "Fogged safety goggles",
    introducedIn: "Chapter 1",
    status: "planned",
    suggestedPayoff: "Breath pattern on lenses matches Chamber B recording.",
    payoffChapter: "Chapter 3",
    emotionalPurpose: "Physical evidence of complicity or frame-up.",
  },
  {
    item: "Cherry blossom petal in centrifuge",
    introducedIn: "Chapter 2",
    status: "planned",
    suggestedPayoff: "Decodes to Aya's timestamped goodbye message.",
    payoffChapter: "Chapter 3",
    emotionalPurpose: "Beauty against sterile lab horror.",
  },
  {
    item: "Don't trust the backup",
    introducedIn: "Chapter 1",
    status: "unresolved",
    suggestedPayoff: "Ren wrote it before erasing his own memory.",
    payoffChapter: "Chapter 3",
    emotionalPurpose: "Self-warning as tragic irony.",
  },
];

const FORESHADOWING_TRACKER_JA: ForeshadowingItem[] = [
  {
    item: "ひび割れた銀の懐中時計",
    introducedIn: "第1章",
    status: "unresolved",
    suggestedPayoff: "主人公の記憶が上書きされた正確な時刻を示す。",
    payoffChapter: "第3章",
    emotionalPurpose: "罪悪、自己、喪失した時間を結ぶ。",
  },
  {
    item: "無印のメモリーカード",
    introducedIn: "第1章",
    status: "unresolved",
    suggestedPayoff: "彩の別れの暗号と同意書不正の証拠を含む。",
    payoffChapter: "第2章",
    emotionalPurpose: "不在を能動的な手がかりに変える。",
  },
  {
    item: "曇った保護ゴーグル",
    introducedIn: "第1章",
    status: "planned",
    suggestedPayoff: "レンズの呼気パターンが室Bの記録と一致する。",
    payoffChapter: "第3章",
    emotionalPurpose: "共犯か陥れかの物的証拠。",
  },
  {
    item: "遠心分離機の桜の花びら",
    introducedIn: "第2章",
    status: "planned",
    suggestedPayoff: "彩のタイムスタンプ付き別れのメッセージに解読される。",
    payoffChapter: "第3章",
    emotionalPurpose: "無機質な研究室への美の対比。",
  },
  {
    item: "バックアップを信じるな",
    introducedIn: "第1章",
    status: "unresolved",
    suggestedPayoff: "蓮が自らの記憶を消す前に書いた警告。",
    payoffChapter: "第3章",
    emotionalPurpose: "自己警告という悲劇的な皮肉。",
  },
];

const MOCK_EN: Record<AgentId, unknown> = {
  concept: {
    logline:
      "A graduate student with fractured memory must unravel a colleague's disappearance inside a Tokyo quantum lab before the past he cannot recall rewrites his future.",
    coreTheme: "Memory as both evidence and betrayal",
    centralConflict:
      "Ren must choose between recovering his lost past and protecting the fragile present tied to the missing researcher.",
    emotionalPromise:
      "Melancholic wonder — grief braided with scientific awe",
    uniqueHook:
      "Quantum decoherence logs behave like diary entries written in a voice that might be his own.",
  },
  character: {
    protagonist: {
      name: "Ren Kuroda",
      role: "Protagonist — amnesiac physics graduate student",
      desire: "Recover the truth behind his memory gaps",
      fear: "That he caused the disappearance",
      flaw: "Obsessive rationalization that masks guilt",
      secret: "He signed an undisclosed consent form for neural mapping",
      arc: "From self-erasure to accountable witness",
      speechStyle: "Quiet, precise, apologetic pauses",
    },
    antagonist: {
      name: "Dr. Yuki Sato",
      role: "Lab director / opposing force",
      desire: "Publish breakthrough results at any ethical cost",
      fear: "Funding collapse and reputational ruin",
      flaw: "Charismatic manipulation",
      secret: "Deleted backup logs the night of the disappearance",
      arc: "Mask of mentorship cracking into coercion",
      speechStyle: "Warm authority, corporate metaphors",
    },
    supporting: [
      {
        name: "Mika Ito",
        role: "Lab technician and Ren's closest ally",
        desire: "Keep the lab safe for honest science",
        fear: "Being scapegoated",
        flaw: "Loyalty that borders on complicity",
        secret: "Saw Ren enter a restricted bay after hours",
        arc: "From silence to whistleblower",
        speechStyle: "Dry humor, practical shorthand",
      },
      {
        name: "Aya Mori",
        role: "Missing researcher",
        desire: "Prove consciousness can be encoded without erasure",
        fear: "Becoming a test subject in her own experiment",
        flaw: "Idealism unchecked by caution",
        secret: "Left a cipher in calibration notes",
        arc: "Absent presence that steers the investigation",
        speechStyle: "Recorded voice: lyrical, urgent",
      },
    ],
  },
  worldbuilding: {
    setting: "Near-future Tokyo — Shinagawa quantum research annex",
    rules:
      "Consciousness-mapping requires cryogenic isolation; data decoheres if observed by unauthorized eyes",
    socialContext:
      "Academic prestige economy; corporate sponsors audit 'emotional risk' in grant proposals",
    atmosphere: "Fluorescent corridors, rain on glass, vending-machine hum at 3 a.m.",
    locations: [
      "Decoherence Chamber B",
      "Rooftop antenna garden",
      "Archived tape library in the basement",
    ],
    symbols: ["Fogged safety goggles", "Unlabeled memory card", "Cherry blossom petal in a centrifuge"],
  },
  plot: {
    beginning:
      "Ren wakes to an empty lab station and a notification that Aya Mori has been missing forty-eight hours.",
    middle:
      "Calibration logs reveal Ren's handwriting in entries dated before his admitted memory loss; Mika helps him break into archived footage.",
    climax:
      "In Chamber B, Ren confronts a playback that suggests he walked Aya into the mapping rig willingly.",
    ending:
      "Ren submits the logs to an independent review board, accepting expulsion if it means the truth survives.",
    twists: [
      "The deleted logs were recovered from a backup Ren supposedly never accessed",
      "Dr. Sato knew about Ren's consent form all along",
    ],
    foreshadowingPlan: [
      "Cherry blossom petal foreshadows Aya's farewell message",
      "Vending machine exact change gag masks timed security lock bypass",
    ],
  },
  "chapter-outline": {
    chapters: [
      {
        number: 1,
        title: "Residual Noise",
        purpose: "Establish mystery, Ren's amnesia, and lab atmosphere",
        emotionalTurn: "Curiosity → unease",
        keyEvents: [
          "Missing person alert",
          "Ren finds fogged goggles in his locker",
          "First decoherence log anomaly",
        ],
        foreshadowing: ["Unlabeled memory card mentioned but not opened"],
      },
      {
        number: 2,
        title: "Calibration Ghost",
        purpose: "Deepen suspicion around Ren's past actions",
        emotionalTurn: "Unease → dread",
        keyEvents: [
          "Handwriting match in logs",
          "Mika admits she saw Ren after hours",
        ],
        foreshadowing: ["Cipher hint in footnotes"],
      },
      {
        number: 3,
        title: "Chamber B",
        purpose: "Climax and moral choice",
        emotionalTurn: "Dread → painful clarity",
        keyEvents: ["Footage confrontation", "Ren decides to expose the lab"],
        foreshadowing: ["Cherry blossom message decoded"],
      },
    ],
    styleGuide: {
      pov: "Close third person on Ren",
      tense: "Past tense",
      proseStyle: "Literary sci-fi — sensory detail, restrained exposition",
      dialogueNotes: "Subtext-heavy; avoid technobabble dumps",
      taboos: ["Sudden full memory recovery", "Villain monologuing"],
    },
    foreshadowingTracker: FORESHADOWING_TRACKER_EN,
  },
  drafting: {
    chapters: DRAFTING_CHAPTERS_EN,
    completeManuscript: buildCompleteManuscript(DRAFTING_CHAPTERS_EN),
  },
  editor: {
    strengths: [
      "Strong atmospheric opening with clear genre signals across all three chapters",
      "Ren's voice stays consistent; the emotional arc from unease to painful clarity lands",
      "Chapter 3 confrontation delivers a satisfying moral choice and thematic payoff",
    ],
    weakPoints: [
      "Chapter 2 could use one more beat of Ren's physical reaction after Mika's confession",
    ],
    pacingIssues: [
      "Chapter 1 middle section lingers slightly before the locker reveal",
      "Chapter 3 upload sequence could breathe one paragraph longer before the final notification",
    ],
    dialogueIssues: [
      "Mika's lines in chapter 2 are effective; Dr. Sato's exposition in chapter 3 could be slightly more subtextual",
    ],
    emotionalClarityIssues: [
      "Ren's guilt is clear by chapter 3; a subtle body cue in chapter 1 would strengthen the through-line",
    ],
    revisionSuggestions: [
      "Sharpen the cherry blossom petal discovery in chapter 3 with one sensory detail",
      "Consider a single line of Ren doubting the upload in the final paragraph for nuance",
    ],
  },
  continuity: {
    issues: [
      {
        category: "foreshadowing",
        severity: "low",
        issue: "Vending-machine exact-change gag is implied in chapter 2 but not explicitly tied to lock bypass on-page.",
        evidence: "Outline plans the gag; chapter 2 mentions exact change at 01:58 without stating the lab joke.",
        suggestedFix: "Add one line of internal recognition from Ren about the night-lock signal.",
      },
      {
        category: "timeline",
        severity: "low",
        issue: "48-hour window is anchored in chapters 1–2 but not referenced in chapter 3.",
        evidence: "Alert in chapter 1; timestamp in chapter 2; chapter 3 uses different clock markers.",
        suggestedFix: "Mention elapsed hours once in the Chamber B scene.",
      },
    ],
    unresolvedForeshadowing: FORESHADOWING_TRACKER_EN.filter(
      (f) => f.status === "unresolved"
    ),
    repeatedMotifs: [
      "Fluorescent light / humming machines — effective across chapters",
      "Notifications bookend the manuscript — strong structural rhyme",
    ],
    missingPayoffs: [],
    overallDiagnosis:
      "Complete three-chapter arc resolves the central conflict with memory-card activation, cherry blossom message, silver watch reveal, and Ren's upload decision. Cross-chapter continuity is strong; minor polish on vending-machine and timeline callbacks would tighten the short novel.",
  },
  publisher: {
    titleIdeas: [
      "Residual Noise",
      "The Decoherence Diaries",
      "Tokyo Quantum Ghost",
    ],
    shortSummary:
      "An amnesiac graduate student investigates a colleague's disappearance in a Tokyo quantum lab and discovers his own past may be the crime scene.",
    longSummary:
      "Ren Kuroda cannot remember the last forty-eight hours — the same window in which researcher Aya Mori vanished from a Shinagawa quantum annex. As calibration logs bear his handwriting and archived footage tightens around Chamber B, Ren must decide whether recovering his memory will exonerate him or prove him complicit. A melancholic sci-fi mystery about consciousness, consent, and the ethics of knowing yourself.",
    logline:
      "When a quantum researcher vanishes, an amnesiac student must decode logs that read like his forgotten diary — or confess to a crime he cannot remember committing.",
    tagline: "Some memories decohere. Others indict.",
    socialPost:
      "New WIP: melancholic sci-fi mystery in modern Tokyo. Amnesia, quantum labs, and a disappearance that might be written in the protagonist's own hand. #SciFi #Mystery #NovelPilot",
    submissionDescription:
      "RESIDUAL NOISE is a literary science-fiction mystery (complete three-chapter short novel) set in near-future Tokyo. It combines quantum-physics speculation with a character-driven amnesia plot in the tradition of Ishiguro's restraint and Chiang's conceptual rigor. Complete materials: story bible, three-chapter outline, full manuscript, editorial and continuity reports.",
  },
};

const MOCK_JA: Record<AgentId, unknown> = {
  concept: {
    logline:
      "記憶を失った大学院生が、東京の量子コンピューティング研究室で起きた同僚の失踪を追ううちに、取り戻せない過去が未来を書き換えようとするメランコリックなSFミステリー。",
    coreTheme: "記憶は証拠であり、裏切りでもある",
    centralConflict:
      "蓮は失われた過去を取り戻すか、失踪した研究者と結びついた今を守るかを選ばなければならない",
    emotionalPromise: "科学的畏敬と悲しみが編み込まれた余韻",
    uniqueHook:
      "量子デコヒーレンスログが、まるで自分が書いた日記のように読める",
  },
  character: {
    protagonist: {
      name: "黒田 蓮",
      role: "主人公 — 記憶障害を抱える物理系大学院生",
      desire: "記憶の空白の正体を突き止める",
      fear: "自分が失踪の原因であること",
      flaw: "罪悪感を合理で覆い隠す執着",
      secret: "神経マッピングの未公開同意書に署名していた",
      arc: "自己消去から責任ある証人へ",
      speechStyle: "静かで正確、謝るような間",
    },
    antagonist: {
      name: "佐藤 由紀",
      role: "研究室長 / 対立勢力",
      desire: "倫理より先に成果を発表する",
      fear: "資金打ち切りと名声の失墜",
      flaw: "魅力的な操作",
      secret: "失踪の夜、バックアップログを削除した",
      arc: "師の仮面が強要へとひび割れる",
      speechStyle: "温かい権威、企業比喩",
    },
    supporting: [
      {
        name: "伊藤 美香",
        role: "技術補佐員、蓮の盟友",
        desire: "誠実な科学のために研究室を守る",
        fear: "身代わりにされること",
        flaw: "共犯に近い忠誠",
        secret: "深夜、制限区域へ入る蓮を見た",
        arc: "沈黙から内部告発へ",
        speechStyle: "乾いたユーモア、実務的な略語",
      },
      {
        name: "森 彩",
        role: "失踪した研究者",
        desire: "消去なしに意識を符号化することを証明する",
        fear: "自らの実験の被験者になること",
        flaw: "慎重さを欠く理想主義",
        secret: "校正ノートに暗号を残した",
        arc: "不在の存在として調査を導く",
        speechStyle: "録音された声：叙情的で切迫",
      },
    ],
  },
  worldbuilding: {
    setting: "近未来の東京 — 品川の量子研究別館",
    rules:
      "意識マッピングには極低温隔離が必要。無許可の観測でデータはデコヒーレンスする",
    socialContext:
      "学術プレステージ経済。スポンサーが助成案の「感情リスク」を監査する",
    atmosphere: "蛍光灯の廊下、ガラスを打つ雨、午前3時の自販機の唸り",
    locations: [
      "デコヒーレンス室B",
      "屋上アンテナ庭",
      "地下のアーカイブテープ庫",
    ],
    symbols: ["曇った保護ゴーグル", "無印のメモリーカード", "遠心分離機の中の桜の花びら"],
  },
  plot: {
    beginning:
      "蓮は空の実験席で目覚め、森彩が四十八時間前から行方不明だと知らされる。",
    middle:
      "校正ログに、蓮が記憶喪失を認める以前の日付で彼の筆跡が現れる。美香はアーカイブ映像へのアクセスを手伝う。",
    climax:
      "室Bで、蓮は自らが彩をマッピング装置へ導いたかのような再生映像と対峙する。",
    ending:
      "蓮は独立審査会にログを提出し、真実が残るなら除籍も受け入れる。",
    twists: [
      "削除されたログが、蓮は触れたはずのないバックアップから復元される",
      "佐藤は蓮の同意書を最初から知っていた",
    ],
    foreshadowingPlan: [
      "桜の花びらは彩の別れのメッセージを予示する",
      "自販機の釣り銭ギャグがセキュリティロック解除のタイミングを隠す",
    ],
  },
  "chapter-outline": {
    chapters: [
      {
        number: 1,
        title: "残留ノイズ",
        purpose: "謎、蓮の記憶障害、研究室の雰囲気を確立",
        emotionalTurn: "好奇心 → 不安",
        keyEvents: [
          "失踪アラート",
          "ロッカーで曇ったゴーグルを発見",
          "最初のデコヒーレンスログ異常",
        ],
        foreshadowing: ["無印メモリーカードに言及するが未開封"],
      },
      {
        number: 2,
        title: "校正の幽霊",
        purpose: "蓮の過去の行動への疑念を深める",
        emotionalTurn: "不安 → 恐怖",
        keyEvents: [
          "ログの筆跡一致",
          "美香が深夜の蓮を目撃したと告白",
        ],
        foreshadowing: ["脚注の暗号ヒント"],
      },
      {
        number: 3,
        title: "室B",
        purpose: "クライマックスと moral choice",
        emotionalTurn: "恐怖 → 痛みを伴う明晰さ",
        keyEvents: ["映像との対峙", "蓮が研究室を暴露する決断"],
        foreshadowing: ["桜のメッセージ解読"],
      },
    ],
    styleGuide: {
      pov: "蓮への近い三人称",
      tense: "過去形",
      proseStyle: "文学的SF — 感覚描写、抑制された説明",
      dialogueNotes: "サブテキスト重視。専門用語の羅列を避ける",
      taboos: ["突然の完全記憶回復", "悪役の独白"],
    },
    foreshadowingTracker: FORESHADOWING_TRACKER_JA,
  },
  drafting: {
    chapters: DRAFTING_CHAPTERS_JA,
    completeManuscript: buildCompleteManuscript(DRAFTING_CHAPTERS_JA),
  },
  editor: {
    strengths: [
      "三章を通じて雰囲気とジャンルが明確",
      "蓮の声が一貫し、感情の弧が不安から痛みを伴う明晰さへ着地",
      "第3章の対峙とアップロードの選択がテーマ的に満足感がある",
    ],
    weakPoints: ["第2章、美香の告白のあと蓮の身体反応をもう一拍足すとよい"],
    pacingIssues: [
      "第1章中盤、ロッカー発見前の説明がやや長い",
      "第3章のアップロード場面を一段落だけ呼吸させる余地あり",
    ],
    dialogueIssues: ["第3章佐藤の説明をもう少しサブテキスト化できる"],
    emotionalClarityIssues: ["第1章に身体の手がかりを一行入れると三章の線が強化される"],
    revisionSuggestions: [
      "第3章の桜の花びら発見に感覚描写を一行",
      "最終段落にアップロードへの一瞬の迷いを入れると深みが出る",
    ],
  },
  continuity: {
    issues: [
      {
        category: "foreshadowing",
        severity: "low",
        issue: "自販機の釣り銭ギャグが第2章で暗示されるが、ロック回避の冗談として明示されていない。",
        evidence: "アウトラインにギャグあり。01:58の記述のみ。",
        suggestedFix: "蓮の内心で夜のロック合図と認識する一行を追加。",
      },
    ],
    unresolvedForeshadowing: FORESHADOWING_TRACKER_JA.filter(
      (f) => f.status === "unresolved"
    ),
    repeatedMotifs: ["蛍光灯 / 機械の唸り — 三章で効果的", "通知が首尾を担う"],
    missingPayoffs: [],
    overallDiagnosis:
      "三章完結で中心葛藤が解決。メモリーカード、桜の花びら、銀の懐中時計、アップロードの決断が揃っている。自販機と時間軸のコールバックを磨けば短編小説としてさらに締まる。",
  },
  publisher: {
    titleIdeas: ["残留ノイズ", "デコヒーレンス日記", "東京量子の幽霊"],
    shortSummary:
      "記憶を失った大学院生が東京の量子研究室で同僚の失踪を追い、自分の過去が犯罪現場かもしれないと知る。",
    longSummary:
      "黒田蓮は直近四十八時間を思い出せない。研究者・森彩が消えたのと同じ時間枠だ。校正ログに彼の筆跡が現れ、アーカイブ映像が室Bへ絞られていくなか、蓮は記憶を取り戻すことが自分を免罪するのか、共犯と証明するのかを選ばなければならない。意識と同意、自己を知る倫理についてのメランコリックなSFミステリー。",
    logline:
      "量子研究者が消えたとき、記憶喪失の学生は忘れた日記のように読めるログを解読するか、覚えていない罪を認めるかに迫られる。",
    tagline: "記憶はデコヒーレンスする。あるいは告発する。",
    socialPost:
      "新作WIP：現代東京のメランコリックSFミステリー。記憶喪失、量子ラボ、主人公自身の手で書かれたかもしれない失踪。#SF #ミステリー",
    submissionDescription:
      "『残留ノイズ』は近未来東京を舞台にした文学的科学SFミステリー（三章完結の短編小説）。ストーリーバイブル、三章アウトライン、全稿、編集・連続性レポート付き。",
  },
};

function buildMockChapterOutline(language: Language) {
  const unit = language === "ja" ? "characters" : "words";
  const perChapter = language === "ja" ? 3000 : 1000;
  const chapterDefs =
    language === "ja"
      ? [
          {
            number: 1,
            title: "残留ノイズ",
            purpose: "謎、蓮の記憶障害、研究室の雰囲気を確立",
            emotionalTurn: "好奇心 → 不安",
            keyEvents: [
              "失踪アラート",
              "ロッカーで曇ったゴーグルを発見",
              "最初のデコヒーレンスログ異常",
            ],
            foreshadowing: ["無印メモリーカードに言及するが未開封"],
          },
          {
            number: 2,
            title: "校正の幽霊",
            purpose: "蓮の過去の行動への疑念を深める",
            emotionalTurn: "不安 → 恐怖",
            keyEvents: [
              "ログの筆跡一致",
              "美香が深夜の蓮を目撃したと告白",
            ],
            foreshadowing: ["脚注の暗号ヒント"],
          },
          {
            number: 3,
            title: "室B",
            purpose: "クライマックスと moral choice",
            emotionalTurn: "恐怖 → 痛みを伴う明晰さ",
            keyEvents: ["映像との対峙", "蓮が研究室を暴露する決断"],
            foreshadowing: ["桜のメッセージ解読"],
          },
        ]
      : [
          {
            number: 1,
            title: "Residual Noise",
            purpose: "Establish mystery, Ren's amnesia, and lab atmosphere",
            emotionalTurn: "Curiosity → unease",
            keyEvents: [
              "Missing person alert",
              "Ren finds fogged goggles in his locker",
              "First decoherence log anomaly",
            ],
            foreshadowing: ["Unlabeled memory card mentioned but not opened"],
          },
          {
            number: 2,
            title: "Calibration Ghost",
            purpose: "Deepen suspicion around Ren's past actions",
            emotionalTurn: "Unease → dread",
            keyEvents: [
              "Handwriting match in logs",
              "Mika admits she saw Ren after hours",
            ],
            foreshadowing: ["Cipher hint in footnotes"],
          },
          {
            number: 3,
            title: "Chamber B",
            purpose: "Climax and moral choice",
            emotionalTurn: "Dread → painful clarity",
            keyEvents: ["Footage confrontation", "Ren decides to expose the lab"],
            foreshadowing: ["Cherry blossom message decoded"],
          },
        ];

  const chapters = chapterDefs.map((c) => ({
    ...c,
    partNumber: 1,
    lengthPlan: { targetLength: perChapter, unit },
  }));

  const parts = [
    {
      number: 1,
      title: language === "ja" ? "第一部" : "Part I",
      purpose:
        language === "ja"
          ? "失踪と記憶の謎を提示する"
          : "Introduce the disappearance and memory mystery",
      targetLength: perChapter * 3,
      chapters,
    },
  ];

  const styleGuide =
    language === "ja"
      ? {
          pov: "蓮への近い三人称",
          tense: "過去形",
          proseStyle: "文学的SF — 感覚描写、抑制された説明",
          dialogueNotes: "サブテキスト重視",
          taboos: ["突然の完全記憶回復", "悪役の独白"],
        }
      : {
          pov: "Close third person on Ren",
          tense: "Past tense",
          proseStyle: "Literary sci-fi — sensory detail, restrained exposition",
          dialogueNotes: "Subtext-heavy; avoid technobabble dumps",
          taboos: ["Sudden full memory recovery", "Villain monologuing"],
        };

  return {
    parts,
    chapters,
    styleGuide,
    foreshadowingTracker:
      language === "ja" ? FORESHADOWING_TRACKER_JA : FORESHADOWING_TRACKER_EN,
  };
}

export function getMockOutput(
  agentId: AgentId,
  language: Language,
  options?: { project?: import("./types").StoryProject; draftChapterNumber?: number }
): unknown {
  if (agentId === "drafting" && options?.draftChapterNumber != null) {
    const chapters = language === "ja" ? DRAFTING_CHAPTERS_JA : DRAFTING_CHAPTERS_EN;
    const ch = chapters.find((c) => c.number === options.draftChapterNumber);
    if (ch) {
      return {
        number: ch.number,
        title: ch.title,
        draft: ch.draft,
        chapterSummary:
          language === "ja"
            ? `第${ch.number}章の要約（モック）`
            : `Summary of chapter ${ch.number} (mock).`,
        continuityNotes: [],
      };
    }
  }

  if (agentId === "chapter-outline") {
    return buildMockChapterOutline(language);
  }

  const mocks = language === "ja" ? MOCK_JA : MOCK_EN;
  return mocks[agentId];
}

export function getMockOutputAsJson(
  agentId: AgentId,
  language: Language
): string {
  return JSON.stringify(getMockOutput(agentId, language), null, 2);
}
