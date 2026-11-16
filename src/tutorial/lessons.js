/* ================= poker school: the lessons ================= */
/* A course for someone who has never played. Each lesson is a list of blocks that the school screens draw:
     ['p',html]  ['h',text]  ['ul',[html]]  ['ol',[html]]  ['dl',[[term,html]]]
     ['key',html]            the one thing to remember
     ['rx',html]             a "clinical correlation" aside: a medical comparison, used only where it really
                             fits or is at least funny. They are garnish; no lesson depends on one.
     ['cards',[codes],caption]   ['streets']   ['ex',{hole,board,caption}]   ['ranks']
     ['openchart']   ['starters']   ['grades']   pieces drawn from the app's own data and styles
     ['quiz',{q,opts,a,why}] one question, answer index a
     ['go',label,drillType]  a jump to a drill
   In any text {As} is drawn as a card and {student} is the student's name.
   The advice has to agree with the coach, because the coach is what grades the student afterwards; the tests
   check the claims about specific hands against the same tables the coach uses. */
export const STUDENT = 'Martin';

/* the ten kinds of hand, best first */
export const RANKS = [
  ['Royal flush', 'A-K-Q-J-10, all one suit. The best hand there is.', ['As', 'Ks', 'Qs', 'Js', 'Ts']],
  ['Straight flush', 'Five in a row, all one suit.', ['9h', '8h', '7h', '6h', '5h']],
  ['Four of a kind', 'All four cards of one rank. Also called quads.', ['Jc', 'Jd', 'Jh', 'Js', '4d']],
  ['Full house', 'Three of one rank plus a pair of another.', ['Kh', 'Kd', 'Ks', '7c', '7d']],
  ['Flush', 'Any five cards of one suit.', ['Ad', 'Jd', '8d', '6d', '2d']],
  ['Straight', 'Five in a row, any suits.', ['9c', '8d', '7s', '6h', '5c']],
  ['Three of a kind', 'Three cards of one rank.', ['Qs', 'Qh', 'Qd', '9c', '4s']],
  ['Two pair', 'Two different pairs.', ['Ah', 'Ad', '8s', '8c', 'Kd']],
  ['One pair', 'Two cards of one rank.', ['Tc', 'Td', 'Ah', '7s', '3d']],
  ['High card', 'None of the above. Your highest card plays.', ['As', 'Jd', '8c', '5h', '2s']],
];

/* rules of thumb for opening hands; each list is checked against the coach's opening range for that seat */
export const STARTERS = [
  {
    seat: 'UTG',
    label: 'From the early seats',
    text: 'Pairs from sixes up, an ace with a jack or better, and suited king-queen or king-jack.',
    hands: [
      'AA',
      'KK',
      'QQ',
      'JJ',
      'TT',
      '99',
      '88',
      '77',
      '66',
      'AKs',
      'AKo',
      'AQs',
      'AQo',
      'AJs',
      'AJo',
      'KQs',
      'KJs',
    ],
  },
  {
    seat: 'BTN',
    label: 'On the button, when everyone has folded to you',
    text: 'Add every pair, every ace, every suited king, and any two cards ten or higher.',
    hands: [
      '55',
      '44',
      '33',
      '22',
      'A9o',
      'A5o',
      'A2o',
      'A2s',
      'K9s',
      'K5s',
      'K2s',
      'KQo',
      'KJo',
      'KTo',
      'QJo',
      'QTo',
      'JTo',
      'QJs',
      'JTs',
    ],
  },
];

export const LESSONS = [
  {
    id: 'goal',
    title: 'The whole game in two minutes',
    sub: 'What you are trying to do, and the two ways to do it.',
    body: [
      [
        'p',
        "Texas hold'em is a betting game played with an ordinary 52-card deck. Every hand, the players put chips into a shared pile called the <b>pot</b>, and one of them takes it.",
      ],
      ['h', 'Two ways to win a pot'],
      [
        'ul',
        [
          '<b>Have the best hand at the end.</b> If two or more players are still in after the last bet, they turn their cards over and the best five-card poker hand wins. This is the showdown.',
          '<b>Be the last one standing.</b> If you bet and everyone else gives up (folds), you win on the spot, and nobody gets to see what you had.',
        ],
      ],
      [
        'p',
        "The second route is what makes it poker and not bingo. You don't need the best cards. You need the other players to believe you might have them, or to decide that finding out costs too much.",
      ],
      ['h', 'What a hand looks like'],
      [
        'ol',
        [
          'Everyone gets <b>two private cards</b>.',
          'Five <b>shared cards</b> are turned up in the middle, in three stages, for everyone to use.',
          'Before the first stage and after each one there is a <b>round of betting</b>: four rounds in all.',
          'Whoever is left at the end shows their cards. The best five out of seven wins the pot.',
        ],
      ],
      [
        'p',
        'Then the cards are shuffled and it starts again. A hand takes a minute or two. Over many hands your goal is simple: finish with more chips than you started with.',
      ],
      [
        'rx',
        "You never see the other players' cards until it is over, so every decision is made on incomplete information. If you have ever had to treat a patient before the labs came back, you already own the core skill.",
      ],
      [
        'key',
        'You win by having the best hand or by making everyone else fold. Most of the skill is in choosing which hands to play and how much to bet.',
      ],
      [
        'quiz',
        {
          q: 'You bet, and every other player folds. What happens?',
          opts: [
            'You win the pot without showing your cards',
            'The hand is dealt again',
            'You have to show the best hand to collect',
          ],
          a: 0,
          why: 'A bet that nobody calls wins the pot right there. Your cards stay secret.',
        },
      ],
    ],
  },

  {
    id: 'ranks',
    title: 'Hand rankings',
    sub: 'The ten kinds of hand, from royal flush down to nothing.',
    body: [
      [
        'p',
        'A poker hand is always exactly <b>five cards</b>. There are ten kinds, and any hand of a higher kind beats any hand of a lower kind. Here they are, best first.',
      ],
      [
        'rx',
        'This is the anatomy chapter: pure memorization, no way around it, and everything that follows assumes you know it cold. The good news is that there are ten items to learn and not two hundred and six.',
      ],
      ['ranks'],
      ['h', 'Four things beginners get wrong'],
      [
        'ul',
        [
          '<b>A flush beats a straight.</b> Five of one suit is harder to make than five in a row.',
          "<b>Three of a kind beats two pair.</b> It feels backwards. It isn't.",
          "<b>An ace plays high or low in a straight</b>, so A-K-Q-J-10 and 5-4-3-2-A both count. It can't sit in the middle: Q-K-A-2-3 is nothing.",
          "<b>All suits are equal.</b> Spades don't beat hearts. Suits only matter for making a flush.",
        ],
      ],
      ['h', 'When two players have the same kind of hand'],
      [
        'p',
        'The higher cards win: a pair of kings beats a pair of nines. If the pairs are the same, the highest remaining card decides. That side card is called the <b>kicker</b>.',
      ],
      ['cards', ['Ks', 'Kd', 'Ah', '7c', '4s'], 'Pair of kings, ace kicker.'],
      ['cards', ['Kh', 'Kc', 'Qd', '7s', '4d'], 'Pair of kings, queen kicker. This one loses.'],
      ['p', 'If all five cards match in rank, the pot is split evenly.'],
      [
        'p',
        "How often will you see these? By the end of a hold'em hand you hold one pair or nothing about six times in ten. Two pair is a good hand. A straight or better is a big one.",
      ],
      ['quiz', { q: 'Which hand wins?', opts: ['A straight', 'A flush'], a: 1, why: 'A flush beats a straight.' }],
      [
        'quiz',
        {
          q: 'Which hand wins?',
          opts: ['Two pair', 'Three of a kind'],
          a: 1,
          why: 'Three of a kind beats two pair. This is the one everybody gets wrong once.',
        },
      ],
      [
        'quiz',
        {
          q: 'Is Q-K-A-2-3 a straight?',
          opts: ['Yes', 'No'],
          a: 1,
          why: "The ace can be the top of a straight (A-K-Q-J-10) or the bottom (5-4-3-2-A), but a straight can't wrap around it.",
        },
      ],
      ['go', 'Practice: What do you have?', 'name'],
    ],
  },

  {
    id: 'deal',
    title: 'How a hand is dealt',
    sub: 'Your two cards, the five in the middle, and the best five of seven.',
    body: [
      ['p', "Hold'em gives you seven cards to make your best five: two of your own and five that everyone shares."],
      ['h', 'Your two cards'],
      [
        'p',
        "Each player is dealt two cards face down. These are your <b>hole cards</b>, and only you see them. In this app yours sit face up at the bottom of the table, and everyone else's show their backs.",
      ],
      ['h', 'The five shared cards'],
      [
        'p',
        'The cards in the middle are called the <b>board</b>. They belong to everyone, and they arrive in three stages:',
      ],
      ['streets'],
      [
        'p',
        'There is a round of betting before the flop (called <b>preflop</b>) and another after each stage, which makes four.',
      ],
      ['h', 'Best five of seven'],
      [
        'p',
        'At the showdown you make the best five-card hand you can from your two cards and the five on the board. You may use both of your cards, one of them, or neither. At a real table you work that out yourself; this app always tells you what you hold.',
      ],
      [
        'ex',
        {
          hole: ['Ah', '9c'],
          board: ['Ks', 'Kd', '7h', '7c', '2s'],
          caption: 'Your cards are on the left, the board on the right.',
        },
      ],
      [
        'quiz',
        {
          q: 'With {Ah} {9c} on that board, what is your best five-card hand?',
          opts: ['One pair of kings', 'Two pair, kings and sevens, with an ace', 'A full house'],
          a: 1,
          why: 'Both pairs are on the board, so everyone has them. Your ace is the fifth card, the kicker, and it beats any opponent who plays the same two pair with a smaller side card.',
        },
      ],
      ['h', 'Playing the board'],
      [
        'ex',
        {
          hole: ['3c', '2d'],
          board: ['As', 'Kh', 'Qd', 'Jc', 'Ts'],
          caption: 'The board is a straight all by itself.',
        },
      ],
      [
        'p',
        'Here your two cards add nothing: the best five cards are the five in the middle. That is called playing the board, and everyone else still in the hand is playing it too. Nothing can beat this particular board, so they all split the pot.',
      ],
      [
        'key',
        'Seven cards, best five. The board is shared, so ask two questions every time: what does this board give everybody, and what do my two cards add to it?',
      ],
      ['go', 'Practice: Who wins?', 'wins'],
    ],
  },

  {
    id: 'table',
    title: 'The button, the blinds and your seat',
    sub: 'Who pays, who acts first, and why acting last is worth chips.',
    body: [
      [
        'p',
        'Three things change every hand: who has the dealer button, who pays the blinds, and when it is your turn. They move together, one seat clockwise per hand.',
      ],
      ['h', 'The button'],
      [
        'p',
        "The white <b>D</b> disc marks the <b>button</b>, the dealer's seat. (The app does the actual dealing.) Everything else is counted from it.",
      ],
      ['h', 'The blinds'],
      [
        'p',
        'The two players to the left of the button have to bet before they see their cards. The first posts the <b>small blind</b>. The next posts the <b>big blind</b>, which is twice as much. At blinds of 25/50 that is 25 and 50 chips.',
      ],
      [
        'p',
        'Blinds exist so that there is always something in the pot worth fighting for. Without them everyone could fold forever at no cost.',
      ],
      [
        'rx',
        'Think of the blinds as your malpractice premium: due every lap of the table, whether or not anything happens.',
      ],
      ['h', 'Who acts when'],
      [
        'ul',
        [
          '<b>Before the flop</b>, the first decision goes to the player on the left of the big blind, a seat known as <b>under the gun</b>. The action runs clockwise, and the big blind goes last.',
          '<b>On the flop, turn and river</b>, the first player still in to the left of the button starts, and the button goes last.',
        ],
      ],
      ['h', 'Why your seat matters'],
      [
        'p',
        'Acting later is a real advantage, because you see what everyone else does before you decide. This is called having <b>position</b>. The button has it on every round after the flop, which makes it the best seat at the table. The blinds and the early seats are the worst.',
      ],
      ['p', 'The app labels every seat, so you never have to count:'],
      [
        'dl',
        [
          ['UTG', 'Under the gun. First to act before the flop.'],
          ['MP, LJ, HJ', 'The middle seats: middle position, lojack and hijack.'],
          ['CO', 'The cutoff, one seat before the button.'],
          ['BTN', 'The button. Last to act after the flop.'],
          ['SB, BB', 'The small blind and the big blind.'],
        ],
      ],
      [
        'key',
        'In an early seat, play only strong hands. In a late seat you can play more of them. The button moves every hand, so everyone takes a turn in every seat.',
      ],
      [
        'quiz',
        {
          q: 'You are on the button. When do you act on the flop?',
          opts: ['First', 'Last', 'It depends on the cards'],
          a: 1,
          why: 'After the flop the button always acts last. That is what makes the seat valuable.',
        },
      ],
      [
        'quiz',
        {
          q: 'Blinds are 100/200 and you are sitting two seats to the left of the button. What do you have to post?',
          opts: ['Nothing', '100', '200'],
          a: 2,
          why: 'One seat left of the button is the small blind. Two seats left is the big blind: 200.',
        },
      ],
    ],
  },

  {
    id: 'actions',
    title: 'Your five moves',
    sub: 'Fold, check, call, bet and raise. And all-in.',
    body: [
      [
        'p',
        'When the action reaches you there are only ever a few things you can do. Which ones depends on whether somebody has already bet in this round.',
      ],
      ['h', 'If nobody has bet yet'],
      [
        'dl',
        [
          ['Check', 'Pass without betting. You stay in the hand for free.'],
          ['Bet', 'Put chips in. Now everyone else has to match them or get out.'],
        ],
      ],
      ['h', 'If somebody has bet'],
      [
        'dl',
        [
          ['Fold', 'Give up. You lose what you have already put in and nothing more.'],
          ['Call', 'Match the bet and stay in.'],
          ['Raise', 'Match the bet and add more on top. Now the others have to match your amount.'],
        ],
      ],
      [
        'p',
        'Before the flop the big blind counts as a bet, so nobody can check: you fold, call the big blind or raise. The one exception is the big blind, who may check if nobody has raised.',
      ],
      ['h', 'When a round ends'],
      [
        'p',
        'A betting round is over when everyone still in has put in the same amount. Then the next card comes. If a bet gets no callers at all, the hand is over and the bettor takes the pot.',
      ],
      ['h', 'No-limit and all-in'],
      [
        'p',
        "This is <b>no-limit</b> hold'em: on your turn you may bet any amount, up to every chip in front of you. Betting all of it is going <b>all-in</b>. Two rules keep that fair:",
      ],
      [
        'ul',
        [
          "You can never be pushed out of a hand because you can't afford a bet. You call with whatever you have left, and that is the most you can win from each opponent.",
          "You can't add chips in the middle of a hand. You play with what is on the table.",
        ],
      ],
      [
        'p',
        'A raise has to be at least as big as the bet or raise before it. If someone bets 100, the smallest raise is to 200.',
      ],
      ['h', 'The buttons in this app'],
      [
        'p',
        'From left to right: <b>Fold</b>, then <b>Check</b> or <b>Call</b> (the label changes with the situation), then <b>Bet</b> or <b>Raise</b> with the amount. The row above them sets the size.',
      ],
      ['key', 'Nobody has bet: check or bet. Somebody has bet: fold, call or raise.'],
      [
        'quiz',
        {
          q: 'On the flop, the player before you bets 100. Which of these are you <b>not</b> allowed to do?',
          opts: ['Fold', 'Check', 'Raise to 300'],
          a: 1,
          why: 'Once there is a bet in front of you, checking is off the menu. You fold, call the 100, or raise to at least 200.',
        },
      ],
      [
        'quiz',
        {
          q: 'You have 400 chips left and an opponent bets 1,000. Can you call?',
          opts: ['No, you have to fold', 'Yes: you go all-in for 400'],
          a: 1,
          why: 'You call with what you have. Their extra 600 is returned to them, and the two of you play for the rest.',
        },
      ],
    ],
  },

  {
    id: 'start',
    title: 'Which hands to play',
    sub: 'Fold most of them. Raise the rest.',
    body: [
      [
        'p',
        "The biggest difference between a losing beginner and a winning player isn't bluffing or reading faces. The winning player <b>folds most hands before the flop</b>. Expect to fold about four out of five.",
      ],
      [
        'rx',
        'Choosing starting hands is triage. Most of what comes through the door is seven-deuce with a mild complaint. Send it home and save your resources for the cases that matter.',
      ],
      ['h', 'What makes two cards good'],
      [
        'ul',
        [
          '<b>High cards.</b> An ace or a king makes the top pair, with a good kicker.',
          '<b>Pairs.</b> You start with a made hand.',
          '<b>Suited</b> cards (same suit) make the occasional flush.',
          '<b>Connected</b> cards (next to each other, like 9-8) make the occasional straight.',
        ],
      ],
      ['h', 'The shorthand'],
      [
        'p',
        'Poker writes a starting hand in two or three characters. <b>AKs</b> is ace-king <b>s</b>uited, <b>AKo</b> is ace-king <b>o</b>ffsuit (two different suits), and <b>TT</b> is a pair of tens. T means ten.',
      ],
      ['h', 'Your seat decides how many'],
      [
        'p',
        'The fewer players left to act after you, the less likely one of them has a monster, and the more hands you can play. At a full table, play about one hand in ten from the first seat and about four in ten from the button. Tap a seat to see exactly which:',
      ],
      ['openchart'],
      ['p', 'Two rules of thumb will get you most of the way:'],
      ['starters'],
      [
        'p',
        'In between, slide from one to the other. The <b>Range charts</b> screen has every seat, and the <b>Open or fold</b> drill makes it automatic.',
      ],
      ['h', 'Raise or fold'],
      [
        'p',
        "If nobody has raised and your hand is on the chart, <b>raise</b>, to about two and a half big blinds. Don't just call the big blind. Calling gives you one way to win (make the best hand); raising gives you two, because everyone might fold.",
      ],
      ['h', 'If someone has raised before you'],
      [
        'p',
        'Tighten up a lot. Their raise says they hold one of the good hands, so now you need one of the very good ones. Fold most of what you would have raised yourself, call with the strong hands, and raise again with queens, kings and aces. In the big blind you can call with a little more, because part of the price is already paid.',
      ],
      [
        'key',
        'Fold four hands in five. Play fewer from the early seats and more from the button. When you do play, come in with a raise.',
      ],
      [
        'quiz',
        {
          id: 'k9o',
          q: 'You are under the gun at a full table and look down at {Ks} {9d}. What do you do?',
          opts: ['Raise', 'Call the big blind', 'Fold'],
          a: 2,
          why: 'King-nine looks pretty and makes second-best hands. With eight players still to act it is a clear fold.',
        },
      ],
      [
        'quiz',
        {
          id: 'a4o',
          q: 'Everyone folds to you on the button. You have {Ah} {4c}.',
          opts: ['Raise', 'Call the big blind', 'Fold'],
          a: 0,
          why: 'Only the two blinds are left to beat, and you will act last all hand. A weak ace is plenty here.',
        },
      ],
      ['go', 'Practice: Open or fold', 'open'],
    ],
  },

  {
    id: 'odds',
    title: 'Outs and pot odds',
    sub: 'How to decide whether a draw is worth paying for.',
    body: [
      [
        'p',
        "Sooner or later you will have a hand that isn't good yet but would be very good with one more card, and somebody will bet. Whether to call is arithmetic, and it takes about five seconds.",
      ],
      ['h', 'Step 1: count your outs'],
      ['p', 'An <b>out</b> is a card that would complete your hand.'],
      [
        'dl',
        [
          ['Flush draw', 'Four cards of one suit. <b>9 outs.</b>'],
          ['Open-ended straight draw', 'Four in a row, like 6-7-8-9. <b>8 outs.</b>'],
          ['Gutshot', 'A straight with a hole in the middle, like 6-7-9-10. <b>4 outs.</b>'],
          ['Flush draw and open-ended straight draw together', '<b>15 outs.</b>'],
        ],
      ],
      ['h', 'Step 2: turn outs into a percentage'],
      [
        'p',
        '<b>The rule of 2 and 4.</b> Multiply your outs by 2 for your chance of hitting on the next card. If you are all-in on the flop and will see both the turn and the river, multiply by 4.',
      ],
      ['p', 'So nine outs is about 18% with one card to come, and about 36% with two.'],
      ['h', 'Step 3: compare it with the price'],
      ['p', 'The price of a call is what you have to put in, divided by the whole pot once you have called.'],
      ['key', 'Needed % = your call ÷ (the pot + their bet + your call)'],
      [
        'p',
        'Say the pot is 100 and your opponent bets 50. You have to call 50, and the pot would then be 200. 50 ÷ 200 = 25%. If you will win more often than that, calling makes money over time. If less, it loses.',
      ],
      [
        'p',
        'Three prices are worth knowing by heart: against a bet of half the pot you need 25%, against a bet the size of the pot you need 33%, and against a small quarter-pot bet about 17%.',
      ],
      [
        'rx',
        "Pot odds are a risk–benefit calculation. The call is the risk, the pot is the benefit, and your outs give you the probability. You wouldn't order a risky procedure with an 8% chance of helping. Don't pay a big bet to chase a gutshot.",
      ],
      [
        'p',
        'That percentage has a name you will see all over this app: <b>equity</b>, your share of the pot on average. The coach is forever comparing your equity with the price.',
      ],
      [
        'quiz',
        {
          q: 'After the flop you have four hearts. How many cards complete your flush?',
          opts: ['4', '9', '13'],
          a: 1,
          why: 'There are thirteen hearts and you can see four of them. Nine are left.',
        },
      ],
      [
        'quiz',
        {
          q: 'The pot is 200 and your opponent bets 100. How often do you need to win to call?',
          opts: ['25%', '33%', '50%'],
          a: 0,
          why: '100 ÷ (200 + 100 + 100) = 25%. A half-pot bet always asks for 25%.',
        },
      ],
      [
        'quiz',
        {
          q: 'Same bet. You have a gutshot (4 outs) and one card to come. Call or fold?',
          opts: ['Call', 'Fold'],
          a: 1,
          why: '4 × 2 = 8%, a long way short of the 25% you need.',
        },
      ],
      ['go', 'Practice: Outs and odds', 'outs'],
    ],
  },

  {
    id: 'reads',
    title: 'Reading the other players',
    sub: 'Ranges, four characters you will meet, and what a bet means.',
    body: [
      [
        'p',
        "You can't see their cards, but you can see everything they do. Good players don't try to guess the exact two cards. They think about the whole set of hands a player could have, and narrow it down with every action. That set is called a <b>range</b>.",
      ],
      [
        'rx',
        "Putting a player on a range is a differential diagnosis. Start broad, then let each finding rule things in or out: where they are sitting, whether they raised, how much they bet. Don't anchor on your first idea. And when the quietest player at the table suddenly raises big, remember that hoofbeats mean horses, not zebras. They have it.",
      ],
      ['h', 'What their actions say'],
      [
        'ul',
        [
          '<b>A raise before the flop</b> means a good starting hand. From an early seat, a very good one.',
          '<b>A call</b> usually means something in the middle: good enough to continue, not good enough to raise.',
          '<b>A bet after the flop</b> means they like the board, or want you to think so.',
          '<b>A big bet on the river</b> from a cautious player is almost never a bluff.',
        ],
      ],
      ['h', 'Four characters you will meet'],
      [
        'dl',
        [
          [
            'The rock',
            'Plays few hands and rarely bets without a strong one. When a rock bets big, fold unless your hand is excellent.',
          ],
          [
            'The calling station',
            'Calls with almost anything and hates folding. Never bluff one: that is prescribing antibiotics for a virus. Bet your good hands and let them pay.',
          ],
          [
            'The maniac',
            "Raises constantly with all sorts of cards. Don't try to out-bluff a maniac. Wait for a solid hand and let them bet into you.",
          ],
          [
            'The solid regular',
            'Plays good hands from good seats and bets when it makes sense. There is no easy money here. Pick on someone else.',
          ],
        ],
      ],
      ['h', 'The app keeps the chart for you'],
      [
        'p',
        'Tap any player at the table to see how they have played so far: how many hands they enter, how often they raise, how aggressive they are after the flop, and the range the coach thinks they hold right now. After a dozen hands the pattern is usually clear.',
      ],
      [
        'key',
        'Ask one question about every bet: which hands would this player do this with? Then compare your hand with all of those, not with the one hand you are afraid of.',
      ],
      [
        'quiz',
        {
          q: 'A player who has folded for twenty minutes suddenly re-raises. You hold ace-jack. What is going on?',
          opts: ['Probably a bluff. Call.', 'They have a big hand. Fold.', 'There is no way to know.'],
          a: 1,
          why: 'Tight players re-raise with the very best hands. Horses, not zebras.',
        },
      ],
      [
        'quiz',
        {
          q: 'You have nothing, and the one player left in the hand calls nearly every bet. Should you bluff?',
          opts: ['Yes, and make it big', 'No'],
          a: 1,
          why: 'A bluff only works on someone who is capable of folding.',
        },
      ],
    ],
  },

  {
    id: 'tourney',
    title: 'Tournaments and going all-in',
    sub: 'Rising blinds, your stack in big blinds, and the bubble.',
    body: [
      ['p', 'This app deals two kinds of poker, and they feel different.'],
      [
        'dl',
        [
          [
            'Cash game',
            'The chips are money. The blinds never change, and you can leave or buy more chips whenever you like.',
          ],
          [
            'Tournament',
            "Everyone pays the same buy-in and gets the same stack. You play until your chips are gone, and the last few players standing share the prize pool. You can't cash chips in along the way.",
          ],
        ],
      ],
      ['h', 'The blinds go up'],
      [
        'p',
        "In a tournament the blinds rise every few hands (every 10 in this app, every 6 in a turbo), and from the third level the big blind also pays an extra <b>ante</b>. A stack that was comfortable keeps shrinking next to the blinds, even if you never lose a pot. You can't wait forever for aces.",
      ],
      ['h', 'Count your stack in big blinds'],
      [
        'p',
        '5,000 chips means nothing by itself. At blinds of 25/50 it is 100 big blinds, which is plenty. At 250/500 it is 10 big blinds, which is an emergency. Think in big blinds; there is a setting that shows every stack that way.',
      ],
      [
        'dl',
        [
          ['40 or more', 'Comfortable. Play normal poker.'],
          ['15 to 40', 'Getting short. Stop calling raises with hands that need to get lucky.'],
          ['Under about 15', 'Push or fold. Before the flop your only moves are all-in and fold.'],
        ],
      ],
      [
        'rx',
        'Your stack in big blinds is the vital sign: check it before every decision. Below about 15 the game stops being an art and becomes a protocol, like ACLS. Two options, shove or fold, and a chart tells you which.',
      ],
      ['h', 'Why all-in?'],
      [
        'p',
        'With a short stack, a normal raise already commits a big slice of your chips, and you would hate to fold if someone raised again. Moving all-in gives you two ways to win: everyone folds and you collect the blinds, which is a real prize when you are short, or someone calls and you still have a hand with a chance. Folding your way down to nothing gives you neither.',
      ],
      [
        'p',
        'With which hands? More than you would think. With 10 big blinds on the button, any pair, any ace and any suited king is a shove. The <b>Range charts</b> screen has the chart for every stack and seat, and the <b>Push or fold</b> drill makes it automatic.',
      ],
      ['h', 'The bubble'],
      [
        'p',
        'Only the top few places are paid. The moment just before the money is called the <b>bubble</b>, and it changes the arithmetic: going out now pays nothing, while hanging on pays something. Near the bubble you call all-ins with fewer hands than usual, especially while other players are shorter than you. The coach measures this for you. Its name is <b>ICM</b>.',
      ],
      [
        'key',
        "Know your stack in big blinds. Deep: play poker. Short: shove or fold. Near the money: don't call off your chips lightly.",
      ],
      [
        'quiz',
        {
          q: 'Blinds are 100/200 and you have 3,000 chips. How many big blinds is that?',
          opts: ['3', '15', '30'],
          a: 1,
          why: '3,000 ÷ 200 = 15 big blinds. Push-or-fold territory.',
        },
      ],
      [
        'quiz',
        {
          id: 'a7o',
          q: 'You have 8 big blinds on the button, everyone folds to you, and you hold {Ac} {7d}.',
          opts: ['Fold', 'Call the big blind', 'Raise to 2.5 big blinds', 'All-in'],
          a: 3,
          why: 'At 8 big blinds it is shove or fold, and an ace on the button is far inside the shoving range.',
        },
      ],
      ['go', 'Practice: Push or fold', 'push'],
    ],
  },

  {
    id: 'app',
    title: 'Finding your way around the table',
    sub: 'The clock, the action bar, the coach and Undo.',
    body: [
      ['p', 'One screen holds everything. From the top down:'],
      [
        'dl',
        [
          ['The clock', 'Level, blinds, hands until the blinds go up, and players left. Tap it for the payouts.'],
          [
            'The table',
            'Every seat shows a name, a stack and a seat label. The <b>D</b> is the button. Bets sit in front of the players and the pot is in the middle.',
          ],
          ['Your cards', 'Bottom center, face up. The line under the table names what you hold right now.'],
          [
            'The action bar',
            'Fold, Check or Call, and Bet or Raise. The row above sets the size: fractions of the pot after the flop, multiples of the blind before it.',
          ],
        ],
      ],
      ['h', 'The coach'],
      ['p', 'Every decision you make is graded the moment you make it:'],
      ['grades'],
      [
        'ul',
        [
          'Tap <b>Coach</b> before you act to see what it would do, and why.',
          'Tap the grade after you act to read the reasoning.',
          'Tap <b>Undo</b> to take the decision back and try the other option. No casino offers this. Use it shamelessly.',
        ],
      ],
      [
        'rx',
        'The coach is the attending looking over your shoulder, except that this one explains its reasoning, never sighs, and lets you take the mistake back.',
      ],
      ['h', 'Worth knowing'],
      [
        'ul',
        [
          'Tap any opponent to pull their chart: how they have played and what they probably hold.',
          '<b>≡</b> opens the table menu: hand history, a four-color deck, stacks in big blinds, and <b>Show equity while deciding</b>, which is worth having on while you learn.',
          '<b>‹</b> leaves the table. Your seat is saved.',
        ],
      ],
      ['h', 'After the game'],
      [
        'p',
        'Every finished game shows your decisions, your biggest leaks and who you were really playing against. <b>Drills</b> isolate one kind of decision at a time, and <b>Your numbers</b> keeps track of where you leak.',
      ],
      ['key', 'Play, read the grade, undo, try the other option. That loop is the whole trainer.'],
    ],
  },

  {
    id: 'play',
    title: 'Your first real game',
    sub: 'Six players, soft opponents, slow blinds. No guide this time.',
    cta: ['Take a seat', 'firstgame'],
    body: [
      [
        'p',
        'You know the rules, you can read a board, and you have played three hands under supervision. Time for a real one.',
      ],
      [
        'p',
        'The button below seats you in a six-player Sit & Go against soft opponents, with slow blinds. The top two finishers are paid. The <b>equity hint</b> is switched on, so a line above your buttons shows your chance of winning and the price of a call. Switch it off in the table menu when you no longer need it.',
      ],
      [
        'ul',
        [
          'Fold most hands. Raise the good ones.',
          'Watch your stack in big blinds as the levels go up.',
          'Read every grade, and use Undo to try the other option.',
          'It is play money. If you bust, register again.',
        ],
      ],
      [
        'rx',
        'See one, do one, teach one. You have seen one and done two. The third step happens at your next home game, when you explain the flop to somebody else.',
      ],
    ],
  },
];

/* the course in order: lessons and guided hands mixed, in three parts */
export const COURSE = [
  [
    'The rules',
    ['lesson:goal', 'lesson:ranks', 'lesson:deal', 'lesson:table', 'lesson:actions', 'hand:see', 'hand:do'],
  ],
  ['Playing well', ['lesson:start', 'lesson:odds', 'hand:odds', 'lesson:reads', 'lesson:tourney']],
  ['On your own', ['lesson:app', 'lesson:play']],
];
