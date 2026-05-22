import type { AgentId, ForeshadowingItem, Language } from "./types";

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
    chapterNumber: 1,
    title: "Residual Noise",
    draft: `The notification arrived at 2:17 a.m., a polite chime that felt obscene against the lab's humming silence. MISSING PERSON — AYA MORI — LAST SEEN: DECOHERENCE CHAMBER B.

Ren stared at the screen until the letters blurred. Forty-eight hours, the message said, as if time were a substance you could measure in a beaker and pour away.

He did not remember yesterday. He did not remember whether he had eaten, or called his mother, or walked home under the vending-machine lights that always flickered on the annex's north side. What he had was a thin, reliable catalog of facts: his name, his department, the location of the men's restroom on the third floor. Everything else arrived in fragments — a woman's laugh, the scent of rain on heated pavement — without context, like debris washed up after a storm he could not name.

Ren stood. His locker door stuck, as it always did, and when it finally gave, something clattered to the tile. Safety goggles, lenses fogged from the inside as though someone had breathed a secret into them. He did not own goggles. He was not scheduled for Chamber B.

On his workstation, a new file pulsed: decoherence_log_4471.tmp. Ren opened it. Waveforms scrolled, beautiful and indifferent. Between them, in a margin note he did not remember writing, a line appeared in his own hand: *Don't trust the backup.*

He closed the file. The lab felt larger then, corridors stretching into fluorescent eternity. Somewhere, a centrifuge spun. Somewhere, Aya Mori was not.

Ren put the goggles in his pocket and went looking for a memory that would not admit whether it belonged to him.`,
  },
  editor: {
    strengths: [
      "Strong atmospheric opening with clear genre signals",
      "Ren's voice is consistent and emotionally restrained",
    ],
    weakPoints: [
      "The missing-person notification could show one concrete sensory anchor sooner",
    ],
    pacingIssues: [
      "Middle section of chapter 1 lingers slightly on exposition before the locker reveal",
    ],
    dialogueIssues: ["Minimal dialogue in chapter 1 — intentional but consider one line from Mika in revision"],
    emotionalClarityIssues: [
      "Ren's guilt could be hinted one beat earlier via physical symptom",
    ],
    revisionSuggestions: [
      "Add a brief flash of Ren touching the locker and expecting nothing — then the goggles",
      "End with a sharper hook: audio whisper from the memory card",
    ],
  },
  continuity: {
    issues: [
      {
        category: "foreshadowing",
        severity: "high",
        issue: "Unlabeled memory card is mentioned but never activated in chapter 1.",
        evidence: "Chapter outline flags the card; draft ends before any interaction.",
        suggestedFix: "End chapter 1 with Ren hearing a faint audio pulse from the card.",
      },
      {
        category: "timeline",
        severity: "medium",
        issue: "48-hour disappearance window is stated once but not tracked on-page.",
        evidence: "Missing-person alert cites 48 hours; no subsequent clock anchor.",
        suggestedFix: "Add a security log timestamp in chapter 2 opening.",
      },
      {
        category: "character",
        severity: "medium",
        issue: "Ren's obsessive rationalization appears only after the locker reveal.",
        evidence: "Early paragraphs are observational; guilt emerges late.",
        suggestedFix: "Give Ren one premature explanation he almost believes in paragraph 2.",
      },
      {
        category: "worldbuilding",
        severity: "low",
        issue: "Quantum decoherence rules are implied but not grounded in one concrete rule.",
        evidence: "Logs are mysterious; no stated constraint on who may observe data.",
        suggestedFix: "One line of signage or policy about unauthorized observation.",
      },
    ],
    unresolvedForeshadowing: FORESHADOWING_TRACKER_EN.filter(
      (f) => f.status === "unresolved"
    ),
    repeatedMotifs: [
      "Fluorescent light / humming machines — effective, monitor density",
    ],
    missingPayoffs: [
      "Cherry blossom petal not yet planted in chapter 1",
      "Silver watch not yet introduced on-page",
    ],
    overallDiagnosis:
      "Strong atmospheric setup with clear genre identity. Primary risks are dormant foreshadowing objects and a soft timeline anchor. The memory-card thread should surface before chapter 2.",
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
      "RESIDUAL NOISE is a literary science-fiction mystery (approx. short-novel outline with complete chapter 1) set in near-future Tokyo. It combines quantum-physics speculation with a character-driven amnesia plot in the tradition of Ishiguro's restraint and Chiang's conceptual rigor. Complete materials: story bible, three-chapter outline, sample chapter, editorial and continuity reports.",
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
    chapterNumber: 1,
    title: "残留ノイズ",
    draft: `通知は午前2時17分に届いた。研究室の唸りを背にして、丁寧なチャイムが不条理に響く。行方不明 — 森 彩 — 最後の目撃：デコヒーレンス室B。

蓮は文字が滲むまで画面を見つめた。四十八時間、メッセージは言った。まるで時間はビーカーで測り、注いで捨てられる物質のように。

彼は昨日を覚えていない。食べたか、母に電話したか、別館北側でいつも明滅する自販機の灯りの下を歩いたか。手元にあるのは薄くて頼りになる事実の目録だけだった。名前、所属、三階男子トイレの場所。それ以外は断片として漂う。女の笑い声、熱したアスファルトの雨の匂い。嵐の名前も、文脈もない。

蓮は立った。ロッカーはいつも通り引っかかり、ようやく開いたとき、何かがタイルに落ちた。保護ゴーグル。内側のレンズは曇っていて、誰かが秘密を息で書いたかのようだった。彼はゴーグルを持っていない。室Bの予定もない。

ワークステーションに新しいファイルが脈打っていた。decoherence_log_4471.tmp。蓮は開いた。波形が流れ、美しく、無関心だった。そのあいだ、覚えのない手書きの注釈が、彼自身の筆跡で現れる。*バックアップを信じるな。*

ファイルを閉じた。研究室はそのとき大きくなった。廊下が蛍光灯の永遠へ伸びる。どこかで遠心分離機が回る。どこかで、森彩はいない。

蓮はゴーグルをポケットに入れ、自分のものかどうかも告げない記憶を探しに行った。`,
  },
  editor: {
    strengths: [
      "冒頭の雰囲気が強く、ジャンルが明確",
      "蓮の声が一貫し、感情が抑制されている",
    ],
    weakPoints: ["失踪通知の直後、もう一つ具体的な感覚描写があるとよい"],
    pacingIssues: ["第1章中盤、ロッカー発見前の説明がやや長い"],
    dialogueIssues: ["第1章は会話が少ない — 意図的だが美香の一行を検討"],
    emotionalClarityIssues: ["罪悪感を身体感覚でもう一拍早く示す"],
    revisionSuggestions: [
      "ロッカーを開けて何もないと思う — その直後にゴーグル",
      "章末にメモリーカードからの囁きでフックを強化",
    ],
  },
  continuity: {
    issues: [
      {
        category: "foreshadowing",
        severity: "high",
        issue: "無印メモリーカードが言及されるが第1章で起動されない。",
        evidence: "アウトラインにカードあり。草案は接触前に終わる。",
        suggestedFix: "第1章末にカードから微かな音声パルスを聞かせる。",
      },
      {
        category: "timeline",
        severity: "medium",
        issue: "48時間の失踪枠が一度だけ示され、以降追跡されない。",
        evidence: "アラートのみ。時刻のアンカーがない。",
        suggestedFix: "第2章冒頭にセキュリティログのタイムスタンプを追加。",
      },
      {
        category: "character",
        severity: "medium",
        issue: "蓮の合理的執着がロッカー発見後にしか現れない。",
        evidence: "前半は観察的。罪悪感が遅い。",
        suggestedFix: "第2段落で蓮が信じかけた説明を一行入れる。",
      },
    ],
    unresolvedForeshadowing: FORESHADOWING_TRACKER_JA.filter(
      (f) => f.status === "unresolved"
    ),
    repeatedMotifs: ["蛍光灯 / 機械の唸り — 効果的、密度に注意"],
    missingPayoffs: [
      "桜の花びらは第1章未配置",
      "銀の懐中時計は未登場",
    ],
    overallDiagnosis:
      "雰囲気とジャンルは明確。伏線オブジェクトの休眠とタイムラインの弱さが主なリスク。第2章前にメモリーカードを活性化すべき。",
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
      "『残留ノイズ』は近未来東京を舞台にした文学的科学SFミステリー（短編小説相当のアウトラインと第1章完稿）。アウトライン、サンプル章、編集・連続性レポート付き。",
  },
};

export function getMockOutput(agentId: AgentId, language: Language): unknown {
  const mocks = language === "ja" ? MOCK_JA : MOCK_EN;
  return mocks[agentId];
}

export function getMockOutputAsJson(
  agentId: AgentId,
  language: Language
): string {
  return JSON.stringify(getMockOutput(agentId, language), null, 2);
}
