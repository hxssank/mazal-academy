export type Lesson = {
  id: string
  title: string
  shortTitle: string
  group: string
  minutes: number
  kicker: string
  intro: string
  concepts: { title: string; text: string }[]
  takeaway: string
  terms: { term: string; definition: string }[]
  quiz: { question: string; options: string[]; correct: number; explanation: string }[]
  sources: { label: string; url: string }[]
}

export const lessons: Lesson[] = [
  {
    id: 'foundation',
    title: 'Give your money a job',
    shortTitle: 'Start here',
    group: 'The foundation',
    minutes: 6,
    kicker: 'Purpose before products',
    intro: 'Investing means committing money to an asset in the hope of earning income or growth. Start with what the money needs to do, and when you need it back. In the experiment, see how inflation changes what cash can buy.',
    concepts: [
      { title: 'One goal, one time horizon', text: 'A payment due next year and retirement decades away are different problems. A market loss matters more when you must sell soon. Inflation, a rise in prices over time, can also increase the future cost of your goal. Write down an amount and a date.' },
      { title: 'Separate money you need to spend', text: 'Map income, bills, emergency savings and debt payments first. A share can fall just when a repair bill arrives. High interest debt also creates a known borrowing cost while investment returns remain uncertain.' },
      { title: 'Willing and able are different', text: 'Risk tolerance is how you feel about losses. Risk capacity is what your finances can absorb. Being comfortable with a 30% fall does not help if that money pays next month\'s rent.' },
    ],
    takeaway: 'Choose the goal and deadline first. The investment has to fit both.',
    terms: [
      { term: 'Time horizon', definition: 'The time until you expect to use the money.' },
      { term: 'Inflation', definition: 'A rise in the general level of prices. The same amount of money then buys less.' },
      { term: 'Risk capacity', definition: 'Your financial ability to absorb a loss and still meet commitments.' },
      { term: 'Risk tolerance', definition: 'Your willingness to accept uncertainty and losses.' },
    ],
    quiz: [
      { question: 'You need the full amount for tuition in eight months. What should drive the choice?', options: ['The biggest gain last year', 'Access to the money and the risk of a shortfall', 'The most popular ticker'], correct: 1, explanation: 'The deadline limits your ability to wait through a decline. Start with the amount you must protect and when you need access.' },
      { question: 'You feel calm about market falls, but have no cash for an unexpected bill. Which statement fits?', options: ['Your risk capacity is automatically high', 'High risk guarantees high returns', 'Your tolerance may exceed your financial capacity'], correct: 2, explanation: 'Comfort with uncertainty does not create spare cash. Tolerance and capacity are separate parts of the decision.' },
    ],
    sources: [
      { label: 'OSC · Getting started with investing', url: 'https://www.getsmarteraboutmoney.ca/learning-path/getting-started/getting-started-with-investing/' },
      { label: 'OSC · Risk tolerance and capacity', url: 'https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/what-is-risk-tolerance-in-investing/' },
      { label: 'OSC · Inflation and purchasing power', url: 'https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/inflation-your-investments/' },
    ],
  },
  {
    id: 'assets',
    title: 'Know what you actually own',
    shortTitle: 'Assets & accounts',
    group: 'The foundation',
    minutes: 7,
    kicker: 'Ownership, lending and cash',
    intro: 'A stock, a bond, an ETF and a TFSA describe different things. Understanding the difference tells you where your return might come from and what can go wrong.',
    concepts: [
      { title: 'An asset makes a particular promise', text: 'A stock is ownership in a company. A bond is a loan to an issuer. A deposit holds cash with a financial institution. Their risks differ. A bond issuer can default, a share can lose value, and cash can lose purchasing power.' },
      { title: 'A fund holds investments', text: 'A fund pools investors\' money. An exchange-traded fund, or ETF, trades on an exchange. Its holdings and strategy determine its risk. An ETF focused on one company or sector can be concentrated despite the fund label.' },
      { title: 'The account is separate', text: 'A Canadian TFSA or RRSP is an account with tax and eligibility rules. It can hold permitted investments. Putting a risky stock inside a TFSA does not remove the stock\'s risk. Check account rules separately from product characteristics.' },
    ],
    takeaway: 'Ask two questions: what does the investment hold, and which account holds it?',
    terms: [
      { term: 'Equity', definition: 'An ownership interest, such as common shares in a company.' },
      { term: 'Bond', definition: 'Debt issued by a borrower that promises payments under stated terms.' },
      { term: 'ETF', definition: 'An exchange-traded fund. You own units or shares in the fund.' },
      { term: 'Registered account', definition: 'A Canadian account or plan with specific tax treatment and rules.' },
    ],
    quiz: [
      { question: 'Which statement separates the account from the investment?', options: ['A TFSA can hold an eligible ETF', 'A TFSA always earns a fixed interest rate', 'An ETF and a TFSA are the same product'], correct: 0, explanation: 'The TFSA is the account. The ETF is one possible investment inside it, subject to eligibility rules.' },
      { question: 'An ETF owns only shares of one company. What does its ETF label tell you?', options: ['The investment cannot lose money', 'It is automatically broadly diversified', 'It trades as a fund, but still has concentrated exposure'], correct: 2, explanation: 'Look through the fund to its holdings. One company remains one company even when a fund owns it.' },
    ],
    sources: [
      { label: 'OSC · Types of investments', url: 'https://www.getsmarteraboutmoney.ca/learning-path/getting-started/types-of-investments/' },
      { label: 'OSC · How ETFs work', url: 'https://www.getsmarteraboutmoney.ca/learning-path/etfs/how-exchange-traded-funds-etfs-work/' },
      { label: 'OSC · What a TFSA can hold', url: 'https://www.getsmarteraboutmoney.ca/learning-path/tfsas/what-is-a-tfsa-and-how-does-it-work/' },
    ],
  },
  {
    id: 'compounding',
    title: 'Watch time change the numbers',
    shortTitle: 'Compounding',
    group: 'The foundation',
    minutes: 8,
    kicker: 'Returns on earlier returns',
    intro: 'Compounding means each period starts with the result of the last. The arithmetic is predictable when you fix the inputs. Market returns are not.',
    concepts: [
      { title: 'Growth can earn more growth', text: 'In a hypothetical account earning 5% each year, $1,000 becomes $1,050, then $1,102.50. The second year earns $52.50 because the first year\'s interest stays invested. This example excludes fees and taxes.' },
      { title: 'Contributions are a separate input', text: 'Money you add increases the balance even when the investment earns nothing. Compare the amount contributed with the investment gain. A smooth projected curve assumes a repeated return. It does not show the path a market investment will take.' },
      { title: 'Count purchasing power', text: 'Inflation measures rising prices. A larger balance may buy less than you expect. If prices rise by 2%, something costing $100 becomes $102 after a year. Compare investment growth with the change in prices, after considering costs and taxes.' },
    ],
    takeaway: 'Separate contributions, investment returns and inflation. They change the result in different ways.',
    terms: [
      { term: 'Principal', definition: 'The starting amount invested or borrowed.' },
      { term: 'Compounding', definition: 'Applying each new period\'s return to the balance left by earlier periods.' },
      { term: 'Nominal return', definition: 'A return measured in money without adjusting for inflation.' },
      { term: 'Real return', definition: 'A return adjusted for the change in purchasing power.' },
    ],
    quiz: [
      { question: 'At a hypothetical fixed 5% annual return, what is $1,000 worth after two years with no deposits or costs?', options: ['$1,100', '$1,102.50', '$1,500'], correct: 1, explanation: '$1,000 × 1.05 × 1.05 = $1,102.50. The extra $2.50 comes from earning a return on the first year\'s $50.' },
      { question: '$1,000 falls by 20%, then rises by 20%. What is left, with no deposits or costs?', options: ['$1,000', '$1,040', '$960'], correct: 2, explanation: '$1,000 × 0.80 × 1.20 = $960. A 20% gain on the smaller $800 balance does not recover a $200 loss.' },
    ],
    sources: [
      { label: 'OSC · How compound interest works', url: 'https://www.getsmarteraboutmoney.ca/learning-path/saving-money/growing-your-savings-with-compound-interest/' },
      { label: 'OSC · Inflation and purchasing power', url: 'https://www.getsmarteraboutmoney.ca/learning-path/understanding-risk/inflation-your-investments/' },
    ],
  },
  {
    id: 'stocks',
    title: 'A share is a piece of a business',
    shortTitle: 'Stocks',
    group: 'How markets work',
    minutes: 7,
    kicker: 'Business results meet market prices',
    intro: 'A share gives you an ownership interest. Your result depends on what the business delivers and what investors will pay for that ownership.',
    concepts: [
      { title: 'Owners take business risk', text: 'A company can grow, struggle or fail. Common shareholders have a residual claim. If a company liquidates, creditors stand ahead of them. A famous name does not guarantee that shareholders recover their money.' },
      { title: 'Count the whole return', text: 'A stock can produce a price change and cash dividends. In a hypothetical example, a $100 share rises to $108 and pays $2. That is a 10% total return before fees and taxes. Dividends can be reduced or stopped.' },
      { title: 'Earnings and the price paid for them', text: 'Annual earnings per share, or EPS, is a company\'s annual profit attributable to each common share. For positive EPS, the price-to-earnings ratio, or P/E, is price divided by EPS. Rearrange it: price = EPS × P/E. A lower multiple can outweigh rising earnings. The experiment\'s chosen multiple is an assumption, not a forecast.' },
    ],
    takeaway: 'Rising earnings do not guarantee a rising share price. Investors may pay a lower multiple for those earnings.',
    terms: [
      { term: 'Dividend', definition: 'A distribution a company declares for shareholders. Future payments are not assured.' },
      { term: 'EPS', definition: 'Earnings per share. Profit attributable to common shareholders divided by the relevant average share count for the period.' },
      { term: 'Total return', definition: 'Price change plus income, measured against the starting investment.' },
      { term: 'P/E ratio', definition: 'Share price divided by earnings per share. Specify the earnings period and whether it uses reported or forecast earnings.' },
    ],
    quiz: [
      { question: 'A $100 share ends at $95 and pays $2 in cash. What is the total return before costs and taxes?', options: ['+2%', '-3%', '-5%'], correct: 1, explanation: 'The $5 price loss plus $2 income equals a $3 loss. $3 divided by the starting $100 is -3%.' },
      { question: 'Annual EPS rises from $5 to $6, but P/E falls from 20 to 15. What happens to the implied price?', options: ['It falls from $100 to $90', 'It rises from $100 to $120', 'It stays at $100 because earnings rose'], correct: 0, explanation: 'The starting price is $5 × 20 = $100. The new price is $6 × 15 = $90. The lower valuation multiple more than offsets the 20% earnings growth.' },
    ],
    sources: [
      { label: 'SEC · Stocks and shareholder risk', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks' },
      { label: 'SEC · Earnings per share and P/E ratios', url: 'https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide' },
    ],
  },
  {
    id: 'bonds',
    title: 'The bond price and yield seesaw',
    shortTitle: 'Bonds & yields',
    group: 'How markets work',
    minutes: 9,
    kicker: 'Fixed payments, changing prices',
    intro: 'A conventional bond promises interest and repayment at maturity. Those promised cash flows can stay fixed while the market price changes.',
    concepts: [
      { title: 'Separate coupon from yield', text: 'A hypothetical $1,000 face-value bond with a 4% annual coupon promises $40 a year. The coupon uses face value. Yield also depends on what you pay. Current yield is annual coupon divided by price. Yield to maturity also considers repayment and timing.' },
      { title: 'Why higher yields lower prices', text: 'If comparable new bonds offer higher yields, an existing fixed-payment bond usually needs a lower price to compete. For unchanged promised cash flows, price and yield move in opposite directions. Credit quality can also change the price.' },
      { title: 'A repayment promise still has risks', text: 'Default can interrupt payments. Selling before maturity can crystallize a price loss. Longer maturity usually means more rate sensitivity, all else equal. Holding to maturity avoids needing an earlier sale, but does not remove default or inflation risk.' },
    ],
    takeaway: 'Fixed income describes the payment terms. It does not mean a fixed market value.',
    terms: [
      { term: 'Coupon', definition: 'The interest payment specified by a bond\'s terms.' },
      { term: 'Maturity', definition: 'The date the issuer is due to repay the bond\'s principal.' },
      { term: 'Yield to maturity', definition: 'The discount rate that equates a bond\'s price with its promised future payments. Realized results can differ.' },
      { term: 'Duration', definition: 'A measure linked to payment timing that helps estimate sensitivity to changes in yield.' },
    ],
    quiz: [
      { question: 'Market yields rise for comparable bonds. What usually happens to an existing fixed-rate bond\'s price?', options: ['It rises by the same percentage', 'It cannot change before maturity', 'It falls'], correct: 2, explanation: 'The old payments need a lower purchase price to provide a higher yield. This holds the bond\'s promised payments and other characteristics fixed.' },
      { question: 'A bond pays $40 annually and costs $800. What is its current yield?', options: ['4%', '5%', '20%'], correct: 1, explanation: '$40 ÷ $800 = 5%. This is current yield only. Yield to maturity also accounts for the repayment amount and remaining payment dates.' },
    ],
    sources: [
      { label: 'SEC · Corporate bond terms', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products' },
      { label: 'SEC · Bond risks', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds' },
      { label: 'SEC · Maturity and interest rate sensitivity', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/what-are' },
      { label: 'SEC · Current yield', url: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/current-yield' },
    ],
  },
  {
    id: 'economy',
    title: 'Follow the path from rates to markets',
    shortTitle: 'Rates & the economy',
    group: 'How markets work',
    minutes: 9,
    kicker: 'Central banks, lenders and expectations',
    intro: 'There is no single interest rate. Overnight borrowing, a five-year loan and a long government bond have different prices and different influences.',
    concepts: [
      { title: 'Policy starts at the short end', text: 'The Bank of Canada sets its target for the overnight rate. This influences other borrowing and saving rates. Higher rates tend to restrain spending and demand, which can reduce inflation pressure over time. The effects take time and depend on the economy.' },
      { title: 'Long yields look beyond today', text: 'Long government bond yields reflect expectations for future short rates and a term premium for holding longer debt. Inflation uncertainty, bond supply and investor demand matter. Central bank policy influences both parts, but a policy cut does not require long yields to fall.' },
      { title: 'A chain of effects is not a forecast', text: 'Rates affect financing costs, asset values and exchange rates. Other forces act at the same time. To assess a claim, state the assumed change, the link to an investment and what could offset it. A rate diagram cannot tell you the next market move.' },
    ],
    takeaway: 'Separate today\'s policy rate from the market\'s expectations about future rates.',
    terms: [
      { term: 'Policy rate', definition: 'A central bank\'s key short-term interest rate target or administered rate.' },
      { term: 'Term premium', definition: 'The extra yield investors require for bearing the risks of longer maturity debt. Estimates can vary and can be negative.' },
      { term: 'Yield curve', definition: 'A comparison of yields across maturities for similar-quality debt.' },
      { term: 'Monetary policy', definition: 'Central bank actions that influence financing conditions and the economy.' },
    ],
    quiz: [
      { question: 'The central bank cuts its policy rate. Must a ten-year government bond yield fall?', options: ['Yes, by exactly the same amount', 'No, future rate expectations and term premiums can change differently', 'Yes, because investors have no role in bond pricing'], correct: 1, explanation: 'A long yield contains more than today\'s overnight rate. Changes in expected future rates or the term premium can offset the policy cut.' },
      { question: 'Which statement best describes a rate increase\'s effect on inflation?', options: ['It can slow demand, with effects that take time', 'It lowers every consumer price immediately', 'It guarantees a stock market decline tomorrow'], correct: 0, explanation: 'Borrowing costs affect spending and investment over time. Supply shocks and other changes can alter the outcome. The mechanism gives no guaranteed next-day market signal.' },
    ],
    sources: [
      { label: 'Bank of Canada · Monetary policy transmission', url: 'https://www.bankofcanada.ca/2021/04/understanding-how-monetary-policy-works/' },
      { label: 'Bank of Canada · Long yields and the term premium', url: 'https://www.bankofcanada.ca/2026/03/sparks-at-bank-article-2026-9/' },
      { label: 'Bank of Canada · Why term premiums can be negative', url: 'https://www.bankofcanada.ca/wp-content/uploads/2024/07/sdp2024-9.pdf' },
    ],
  },
  {
    id: 'diversification',
    title: 'Spread risk across your portfolio',
    shortTitle: 'Diversification',
    group: 'Your investing process',
    minutes: 8,
    kicker: 'Manage dependence on one outcome',
    intro: 'A portfolio is the set of investments you own. Its risk depends on the size of each holding and how the holdings behave together.',
    concepts: [
      { title: 'Count exposures, not tickers', text: 'Ten funds can own many of the same companies. Diversification spreads exposure across issuers, sectors, regions and asset types. Read holdings and weights to find overlap. A long list of names alone tells you little.' },
      { title: 'Different assets can still fall together', text: 'Diversification can reduce dependence on a single company or sector. It cannot guarantee a profit or prevent every loss. Stocks and bonds can both lose value. A mix needs to fit the goal, time horizon and ability to absorb losses.' },
      { title: 'Weights change as prices move', text: 'A hypothetical 60% stock allocation can drift upward if stocks grow faster than other holdings. Rebalancing moves the mix toward its chosen target. New contributions can help. Trades may create fees or taxes, so the rule belongs in the plan.' },
    ],
    takeaway: 'The useful question is what could hurt your holdings together.',
    terms: [
      { term: 'Asset allocation', definition: 'How a portfolio is divided among types of investments.' },
      { term: 'Concentration', definition: 'A large dependence on one holding, sector or shared risk.' },
      { term: 'Correlation', definition: 'A measure of how returns move together over a particular period. It can change.' },
      { term: 'Rebalancing', definition: 'Adjusting holdings to bring portfolio weights toward a chosen target.' },
    ],
    quiz: [
      { question: 'You buy three technology funds with nearly identical top holdings. What should you inspect?', options: ['Only the number of fund names', 'Only each fund\'s recent return', 'The combined company and sector exposure'], correct: 2, explanation: 'Overlapping holdings can leave the portfolio dependent on the same companies. More funds do not automatically mean more diversification.' },
      { question: 'A portfolio drifts away from its planned allocation. What does rebalancing do?', options: ['Restores the chosen mix, subject to costs and taxes', 'Guarantees the highest possible future return', 'Removes all market risk'], correct: 0, explanation: 'Rebalancing manages the portfolio\'s mix. It is a risk-control process, not a guarantee that the next trade will outperform.' },
    ],
    sources: [
      { label: 'SEC · Allocation and diversification', url: 'https://www.investor.gov/introduction-investing/getting-started/asset-allocation' },
      { label: 'SEC · Rebalancing a portfolio', url: 'https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset' },
    ],
  },
  {
    id: 'fees',
    title: 'Keep track of what leaves the account',
    shortTitle: 'Fees & friction',
    group: 'Your investing process',
    minutes: 6,
    kicker: 'Small percentages, repeated deductions',
    intro: 'Returns are uncertain. Many investment costs apply even in a losing year. Know the full cost before comparing two products or services.',
    concepts: [
      { title: 'Fees reduce the amount that can grow', text: 'A fee takes money out of the investment. That money also misses later returns. A hypothetical 1% annual fee on an average $10,000 balance costs about $100 for that year. The dollar cost changes as the balance changes.' },
      { title: 'Read beyond the advertised fee', text: 'A fund\'s management expense ratio includes management and operating expenses. It does not describe every investor cost. Trading commissions, bid-ask spreads, currency conversion and separate advice or account charges may also apply.' },
      { title: 'Compare like with like', text: 'Compare products with similar holdings, risk and service. A lower fee is a cost advantage, not proof of a suitable investment. For a Canadian fund, read its Fund Facts or ETF Facts and the account\'s fee schedule. Taxes depend on holdings and account rules.' },
    ],
    takeaway: 'Ask for the total cost in dollars for your balance and trading pattern.',
    terms: [
      { term: 'MER', definition: 'Management expense ratio. An annual measure of a fund\'s management and operating expenses relative to its assets.' },
      { term: 'Commission', definition: 'A charge for carrying out a purchase or sale.' },
      { term: 'Bid-ask spread', definition: 'The gap between the quoted buying and selling prices.' },
      { term: 'Net return', definition: 'The return after specified deductions. Check which costs the calculation includes.' },
    ],
    quiz: [
      { question: 'A platform advertises zero trading commissions. What follows?', options: ['Every investment on it is free to own', 'All currency conversion is free', 'Fund expenses, spreads or other charges may still apply'], correct: 2, explanation: 'A zero commission removes one charge. It does not remove every product expense or trading cost.' },
      { question: 'Roughly what is a 1% annual fee on an average balance of $10,000?', options: ['$10', '$100', '$1,000'], correct: 1, explanation: '$10,000 × 0.01 = $100. That is an illustration for one year, before any further effects of the deduction on future growth.' },
    ],
    sources: [
      { label: 'SEC · How fees affect a portfolio', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated' },
      { label: 'SEC · Fund costs beyond the expense ratio', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/mutual-fund-and-etf-fees-and-expenses-investor-bulletin' },
      { label: 'OSC · ETF fees and disclosure', url: 'https://www.getsmarteraboutmoney.ca/learning-path/etfs/how-exchange-traded-funds-etfs-work/' },
    ],
  },
  {
    id: 'plan',
    title: 'Write rules before the market tests them',
    shortTitle: 'Your first plan',
    group: 'Your investing process',
    minutes: 8,
    kicker: 'Turn understanding into decisions',
    intro: 'A short written plan gives each decision a reference point. It should describe your money and constraints well enough that you can explain why an investment belongs.',
    concepts: [
      { title: 'Make the goal measurable', text: 'Record the goal, amount, deadline and contribution you can afford. Separate cash needed for bills or emergencies. Name the losses your finances can absorb. If the numbers do not fit, revisit the contribution, goal or deadline instead of assuming a higher return.' },
      { title: 'Decide how you will review', text: 'Record the intended asset mix and a review rule. For example, a hypothetical plan might review annually and after a major income change. Write a rebalancing rule and cost checks. A market headline alone does not describe a change in your needs.' },
      { title: 'Check claims before acting', text: 'Find the original document behind a claim, check dates and separate facts from forecasts. For someone offering investments, verify registration through your securities regulator. Pressure to act now and promises of high returns with little risk are fraud warning signs.' },
    ],
    takeaway: 'A usable plan says what you own, why you own it and what would make you reconsider.',
    terms: [
      { term: 'Investment policy', definition: 'Written goals, constraints and rules for making and reviewing investment decisions.' },
      { term: 'Contribution', definition: 'New money you add, separate from any investment return.' },
      { term: 'Forecast', definition: 'An estimate of a future outcome that depends on assumptions and can be wrong.' },
      { term: 'Review trigger', definition: 'A date or change in circumstances that prompts you to reassess the plan.' },
    ],
    quiz: [
      { question: 'Which line is useful in an investing plan?', options: ['Buy whatever rose the most this week', 'Beat everyone else every month', 'Name the goal, deadline, contribution and review rule'], correct: 2, explanation: 'Specific inputs let you assess whether a decision fits. A promise to outperform does not explain your needs or constraints.' },
      { question: 'Someone promises a very high return with no risk and demands an immediate transfer. What is the next step?', options: ['Transfer a small amount to reserve the offer', 'Pause and independently verify the person and the claim', 'Assume the deadline proves demand'], correct: 1, explanation: 'Guaranteed high returns and pressure are warning signs. Verify through independent official sources before sending money or personal information.' },
    ],
    sources: [
      { label: 'OSC · Create an investment plan', url: 'https://www.getsmarteraboutmoney.ca/learning-path/making-a-plan/create-your-investment-plan/' },
      { label: 'OSC · Signs of investment fraud', url: 'https://www.getsmarteraboutmoney.ca/learning-path/types-of-fraud/4-ways-to-avoid-investment-scams/' },
    ],
  },
]
