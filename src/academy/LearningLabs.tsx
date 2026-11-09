import { useEffect, useId, useState } from 'react';
import { useBrowserRecord } from './useBrowserRecord.ts';
import { planStorageKey } from './progress-storage.ts';
import type { CSSProperties, ReactNode } from 'react';
import { bondPrice, compoundInvestment, feeProjection, purchasingPower, stockPrice, weightedPortfolioReturn } from '../../shared/learning.ts';
import './labs.css';

const money = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
const preciseMoney = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const compactMoney = (value: number) => `$${new Intl.NumberFormat('en-CA', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`;
const percent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
const signedPercent = (value: number) => {
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? '+' : ''}${percent(rounded === 0 ? 0 : rounded)}`;
};
const teal = '#a8e6ca';
const rose = '#f88896';
const blue = '#9cbbef';

function Slider({ label, value, onChange, min, max, step = 1, format = String, help, disabled = false }: {
  label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number;
  format?: (value: number) => string; help?: string; disabled?: boolean;
}) {
  const id = useId();
  return <div className="lab-slider">
    <div className="lab-slider-heading"><label htmlFor={id}>{label}</label><output htmlFor={id}>{format(value)}</output></div>
    <input disabled={disabled} id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}
      aria-valuetext={format(value)} aria-describedby={help ? `${id}-help` : undefined}
      style={{ '--range-fill': `${(value - min) / (max - min || 1) * 100}%` } as CSSProperties}/>
    {help && <p className="lab-control-help" id={`${id}-help`}>{help}</p>}
  </div>;
}

function Note({ children }: { children: ReactNode }) {
  return <div className="lab-note"><span aria-hidden="true">↳</span><p>{children}</p></div>;
}

interface ChartLine { label: string; color: string; values: { x: number; y: number }[]; dashed?: boolean }

function LineChart({ lines, title, description, xLabel = 'Years', xFormat = String, marker, baseline, zeroBaseline = true }: {
  lines: ChartLine[]; title: string; description: string; xLabel?: string; xFormat?: (value: number) => string;
  marker?: number; baseline?: number; zeroBaseline?: boolean;
}) {
  const id = useId();
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px)');
    const update = () => setNarrow(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const chartWidth = narrow ? 360 : 520;
  const right = chartWidth - 20;
  const allPoints = lines.flatMap(line => line.values);
  const maxX = Math.max(...allPoints.map(point => point.x), 1);
  const minY = zeroBaseline ? Math.min(0, ...allPoints.map(point => point.y)) : Math.min(...allPoints.map(point => point.y)) * .95;
  const maxY = Math.max(...allPoints.map(point => point.y), 1) * 1.07;
  const x = (value: number) => 54 + value / maxX * (right - 54);
  const y = (value: number) => 20 + (maxY - value) / (maxY - minY || 1) * 182;
  const path = (values: ChartLine['values']) => values.map((point, index) => `${index ? 'L' : 'M'}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`).join(' ');
  return <figure className="lab-chart-wrap">
    <svg className="lab-chart" viewBox={`0 0 ${chartWidth} 245`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{description}</desc>
      <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lines[0].color} stopOpacity=".2"/><stop offset="1" stopColor={lines[0].color} stopOpacity="0"/></linearGradient></defs>
      {[0, .5, 1].map(fraction => {
        const value = maxY - fraction * (maxY - minY);
        return <g key={fraction}><line className="lab-chart-grid" x1="54" x2={right} y1={y(value)} y2={y(value)}/><text x="44" y={y(value) + 4} textAnchor="end">{compactMoney(value)}</text></g>;
      })}
      {baseline !== undefined && <line x1="54" x2={right} y1={y(baseline)} y2={y(baseline)} className="lab-chart-baseline"/>}
      {zeroBaseline && <path d={`${path(lines[0].values)}L${right},202L54,202Z`} fill={`url(#${id}-fill)`}/>}
      {lines.map(line => <g key={line.label}><path d={path(line.values)} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={line.dashed ? '5 5' : undefined}/><circle cx={right} cy={y(line.values.at(-1)!.y)} r="4" fill={line.color}/></g>)}
      {marker !== undefined && <line x1={x(marker)} x2={x(marker)} y1="12" y2="205" stroke="#eef4ef" strokeOpacity=".5" strokeDasharray="3 4"/>}
      <text x="54" y="228">{xFormat(0)}</text><text x={(54 + right) / 2} y="228" textAnchor="middle">{xLabel}</text><text x={right} y="228" textAnchor="end">{xFormat(maxX)}</text>
    </svg>
    <figcaption className="lab-chart-legend">{lines.map(line => <span key={line.label}><i style={{ background: line.color }} className={line.dashed ? 'is-dashed' : ''}/>{line.label}</span>)}</figcaption>
  </figure>;
}

function FoundationsLab() {
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(3);
  const points = purchasingPower(amount, inflation, years);
  const real = points.at(-1)!.balance;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">Money & time</span><h3>Same dollars. Less buying power.</h3><p>Leave cash earning 0% and change the rate at which prices rise.</p></div>
    <div className="lab-big-number"><strong>{money(real)}</strong><span>What {money(amount)} buys in today's dollars after {years} years</span></div>
    <LineChart title="Cash balance and purchasing power" description={`After ${years} years at ${percent(inflation)} inflation, ${money(amount)} in cash has purchasing power of ${money(real)} in today's dollars.`} lines={[
      { label: 'Dollars in the account', color: teal, values: points.map(point => ({ x: point.year, y: point.contributions })) },
      { label: "Buying power today", color: rose, values: points.map(point => ({ x: point.year, y: point.balance })) },
    ]}/>
    <div className="lab-controls"><Slider label="Cash set aside" value={amount} onChange={setAmount} min={1000} max={50000} step={1000} format={money}/><Slider label="Years held" value={years} onChange={setYears} min={1} max={30} format={value => `${value} years`}/><Slider label="Annual inflation" value={inflation} onChange={setInflation} min={0} max={10} step={.5} format={percent}/></div>
    <Note>{inflation === 0 ? 'With no inflation, buying power stays the same.' : `Buying power falls ${percent((1 - real / amount) * 100)} even though the account still shows ${money(amount)}.`} Cash can still be useful for bills and money you need soon.</Note>
    <p className="lab-assumption">Hypothetical, constant inflation. Cash earns no interest. Buying power = cash ÷ (1 + inflation) ^ years.</p>
  </>;
}

const assetExamples = {
  cash: { label: 'Cash', role: 'You are a depositor', destination: 'Bank deposit', destinationDetail: 'You hold an account balance', return: 'Interest', explanation: 'A bank may pay you interest on the balance. You can use the cash for near-term spending.', failure: 'Inflation can rise faster than the interest you earn. Deposit protection has eligibility rules and limits.', flowBack: 'Balance + interest', receipt: 'Access to cash', icon: 'cash' },
  stock: { label: 'Stock', role: 'You are an owner', destination: 'Company share', destinationDetail: 'You own a small part of a business', return: 'Dividends + price change', explanation: 'A business can share profits through dividends. Its share price changes as buyers and sellers reassess its future.', failure: 'Profits and share prices can fall. Dividends can stop. A failed business can leave shareholders with nothing.', flowBack: 'Possible dividends', receipt: 'Ownership', icon: 'stock' },
  bond: { label: 'Bond', role: 'You are a lender', destination: 'Bond issuer', destinationDetail: 'A government or company owes you', return: 'Interest + repayment', explanation: 'A typical fixed-rate bond promises coupon payments and principal at maturity. Its resale price changes before maturity.', failure: 'The issuer can default. Rising yields can lower the resale price. Inflation can erode the value of fixed payments.', flowBack: 'Coupons + principal', receipt: 'A debt claim', icon: 'bond' },
  fund: { label: 'Fund / ETF', role: 'You hold a basket', destination: 'Investment fund', destinationDetail: 'A fund owns the underlying assets', return: 'Returns of its holdings, less fees', explanation: 'Your fund units give you exposure to its holdings. An ETF trades on an exchange. A fund can hold stocks, bonds, or other assets.', failure: 'A fund can lose value. A narrow sector fund can still be concentrated, and fees reduce what you keep.', flowBack: "Holdings' returns", receipt: 'Fund units', icon: 'fund' },
} as const;

function AssetSymbol({ kind }: { kind: string }) {
  return <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5">
    {kind === 'cash' ? <><path d="M6 15h28M9 16v14m7-14v14m8-14v14m7-14v14M5 32h30M6 12l14-7 14 7"/><circle cx="20" cy="11" r="1"/></> : kind === 'stock' ? <><rect x="7" y="16" width="11" height="18" rx="1"/><rect x="18" y="6" width="15" height="28" rx="1"/><path d="M23 11h5m-5 6h5m-5 6h5M11 22h3m-3 6h3"/></> : kind === 'bond' ? <><rect x="7" y="5" width="26" height="29" rx="2"/><path d="M12 11h16m-16 5h16m-16 5h7"/><circle cx="26" cy="27" r="4"/></> : <><rect x="6" y="6" width="11" height="11" rx="2"/><rect x="23" y="6" width="11" height="11" rx="2"/><rect x="6" y="23" width="11" height="11" rx="2"/><rect x="23" y="23" width="11" height="11" rx="2"/></>}
  </svg>;
}

function AssetsLab() {
  const [choice, setChoice] = useState<keyof typeof assetExamples>('stock');
  const asset = assetExamples[choice];
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">Follow the money</span><h3>What are you actually buying?</h3><p>Pick an asset to see what you own and where its return comes from.</p></div>
    <div className="lab-choice-group" role="group" aria-label="Choose an asset">{Object.entries(assetExamples).map(([key, value]) => <button key={key} aria-pressed={choice === key} onClick={() => setChoice(key as keyof typeof assetExamples)}>{value.label}</button>)}</div>
    <div className="lab-asset-flow" aria-label={`You exchange money for ${asset.receipt.toLowerCase()}. ${asset.role}.`}>
      <div className="lab-flow-node"><div className="lab-person-icon" aria-hidden="true"><svg width="38" height="38" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="12" r="6"/><path d="M8 34v-5a12 12 0 0 1 24 0v5"/></svg></div><strong>You</strong><span>{asset.role}</span></div>
      <div className="lab-flow-arrows"><span>Money</span><i aria-hidden="true">→</i><i aria-hidden="true">←</i><span>{asset.receipt}</span></div>
      <div className="lab-flow-node is-asset"><AssetSymbol kind={asset.icon}/><strong>{asset.destination}</strong><span>{asset.destinationDetail}</span></div>
    </div>
    <div className="lab-fact-card"><span className="lab-eyebrow">Where the return comes from</span><h4>{asset.return}</h4><p>{asset.explanation}</p></div>
    <div className="lab-fact-card lab-risk-card"><span className="lab-eyebrow">What can go wrong</span><p>{asset.failure}</p></div>
    <Note>{choice === 'stock' ? 'Buying an existing share usually pays another investor. The business gets new capital when it issues shares.' : choice === 'bond' ? 'Buying an existing bond pays its seller. Buying a newly issued bond lends money to the issuer.' : choice === 'fund' ? 'ETF describes how a fund is structured and traded. It does not tell you whether the investments inside are safe.' : 'A stable account balance does not guarantee stable purchasing power.'}</Note>
  </>;
}

function CompoundingLab() {
  const [start, setStart] = useState(5000);
  const [monthly, setMonthly] = useState(200);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(6);
  const points = compoundInvestment(start, monthly, rate, years);
  const last = points.at(-1)!;
  const gain = last.balance - last.contributions;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">Compounding simulator</span><h3>Give your money time.</h3><p>Change one input. Watch your contributions and the investment result separate.</p></div>
    <div className="lab-big-number"><strong>{money(last.balance)}</strong><span>Hypothetical balance after {years} years</span></div>
    <div className="lab-metric-pair"><div><span>You put in</span><strong>{money(last.contributions)}</strong></div><div><span>{gain >= 0 ? 'Investment growth' : 'Investment loss'}</span><strong className={gain < 0 ? 'lab-negative' : 'lab-positive'}>{gain < 0 ? '−' : '+'}{money(Math.abs(gain))}</strong></div></div>
    <LineChart title="Compounding over time" description={`You contribute ${money(last.contributions)} and finish with ${money(last.balance)} after ${years} years at a constant ${percent(rate)} annual return.`} lines={[
      { label: 'Account balance', color: teal, values: points.map(point => ({ x: point.year, y: point.balance })) },
      { label: 'Money you put in', color: blue, dashed: true, values: points.map(point => ({ x: point.year, y: point.contributions })) },
    ]}/>
    <div className="lab-controls lab-controls-two"><Slider label="Starting amount" value={start} onChange={setStart} min={0} max={50000} step={500} format={money}/><Slider label="Monthly contribution" value={monthly} onChange={setMonthly} min={0} max={1500} step={25} format={money}/><Slider label="Time invested" value={years} onChange={setYears} min={1} max={40} format={value => `${value} years`}/><Slider label="Annual return" value={rate} onChange={setRate} min={-5} max={12} step={.5} format={percent}/></div>
    <Note>{rate > 0 ? 'Each period can earn a return on earlier returns. Try doubling the years, then compare the growth.' : rate < 0 ? 'Compounding also works against you when returns are negative. Adding money does not eliminate investment losses.' : 'At 0% return, the final balance is exactly what you put in.'}</Note>
    <p className="lab-assumption">Hypothetical constant effective annual return, converted to a monthly rate. Contributions arrive at each month end. No taxes, fees, or inflation. Real returns vary and can be negative.</p>
  </>;
}

function StocksLab() {
  const [earnings, setEarnings] = useState(5);
  const [multiple, setMultiple] = useState(20);
  const price = stockPrice(earnings, multiple);
  const change = (price / 100 - 1) * 100;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">A business and its price</span><h3>Two levers move a share price.</h3><p>A simple valuation connects the business's earnings to the price investors pay for them.</p></div>
    <div className="lab-stock-equation" role="group" aria-label={`${preciseMoney(earnings)} earnings per share multiplied by a ${multiple} price-to-earnings ratio equals a ${preciseMoney(price)} share price.`}><div><span>Earnings per share</span><strong>{preciseMoney(earnings)}</strong></div><span aria-hidden="true">×</span><div><span>Price / earnings</span><strong>{multiple}×</strong></div><span aria-hidden="true">=</span><div className="lab-equation-result"><span>Share price</span><strong>{preciseMoney(price)}</strong></div></div>
    <div className="lab-stock-price"><span>Illustrative share price</span><strong>{preciseMoney(price)}</strong><span className={change < 0 ? 'lab-negative' : 'lab-positive'}>{signedPercent(change)} vs. the $100 starting example</span></div>
    <div className="lab-controls"><Slider label="Annual earnings per share" value={earnings} onChange={setEarnings} min={1} max={10} step={.5} format={value => `$${value.toFixed(2)}`}/><Slider label="P/E multiple investors pay" value={multiple} onChange={setMultiple} min={5} max={40} format={value => `${value}×`}/></div>
    <button className="lab-scenario-button" onClick={() => { setEarnings(6); setMultiple(15); }}>Try it: earnings rise, price falls <span aria-hidden="true">↗</span></button>
    <Note>{earnings > 5 && price < 100 ? `Earnings rose ${percent((earnings / 5 - 1) * 100, 0)}, but a lower P/E pushed the share price below $100. A better business result does not always mean a higher share price.` : 'A high P/E means investors pay more for each dollar of earnings. It can reflect expected growth, but that growth may fail to arrive.'}</Note>
    <p className="lab-assumption">Invented business. Price = earnings per share × P/E. This relationship alone does not establish fair value. The usual P/E comparison is not useful when earnings are zero or negative. Dividends are excluded.</p>
  </>;
}

function BondsLab() {
  const [yieldRate, setYieldRate] = useState(4);
  const shortPrice = bondPrice(1000, 4, yieldRate, 2);
  const longPrice = bondPrice(1000, 4, yieldRate, 10);
  const curve = (years: number) => Array.from({ length: 41 }, (_, index) => ({ x: index / 4, y: bondPrice(1000, 4, index / 4, years) }));
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">The bond seesaw</span><h3>Yields up. Existing prices down.</h3><p>Both bonds promise $40 a year and $1,000 at maturity. Change the yield new buyers demand.</p></div>
    <div className="lab-bond-prices">{[{ years: 2, price: shortPrice, color: teal }, { years: 10, price: longPrice, color: rose }].map(bond => <div key={bond.years} style={{ '--bond-color': bond.color } as CSSProperties}><span><i/>{bond.years}-year bond</span><strong>{money(bond.price)}</strong><small>{signedPercent((bond.price / 1000 - 1) * 100)} vs. $1,000 face value</small></div>)}</div>
    <LineChart title="Bond price falls as the market yield rises" description={`At a ${percent(yieldRate)} market yield, the 2-year bond costs ${money(shortPrice)} and the 10-year bond costs ${money(longPrice)}. Both continue to pay $40 per year.`} lines={[
      { label: '2-year maturity', color: teal, values: curve(2) }, { label: '10-year maturity', color: rose, values: curve(10) },
    ]} xLabel="Market yield" xFormat={value => `${value}%`} marker={yieldRate} baseline={1000} zeroBaseline={false}/>
    <div className="lab-controls"><Slider label="Market yield demanded" value={yieldRate} onChange={setYieldRate} min={0} max={10} step={.25} format={value => percent(value, 2)}/></div>
    <div className="lab-fixed-payment"><span>Annual coupon stays fixed</span><strong>$40 <small>per bond</small></strong></div>
    <Note>{yieldRate === 4 ? 'When the market yield matches the 4% coupon rate, both bonds trade at $1,000.' : `At ${percent(yieldRate, 2)} yield, buyers pay ${yieldRate > 4 ? 'less' : 'more'} for the same future payments. The longer bond changes more because more of its payments arrive later.`}</Note>
    <details className="lab-model-details"><summary>How this model prices the bonds</summary><p>Price is the sum of each annual coupon and the final principal repayment, discounted at the selected yield. There are exactly 2 or 10 years until maturity. No default, taxes, fees, accrued interest, or early redemption. Holding to maturity still exposes you to default and inflation risk.</p></details>
  </>;
}

function EconomyLab() {
  const [policy, setPolicy] = useState(4);
  const [futureReal, setFutureReal] = useState(1.5);
  const [inflation, setInflation] = useState(2);
  const [premium, setPremium] = useState(.5);
  const longYield = futureReal + inflation + premium;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">Who sets interest rates?</span><h3>One policy rate. Many market yields.</h3><p>Separate today's central-bank policy setting from a simplified long-term yield.</p></div>
    <div className="lab-rate-map"><div className="lab-rate-node"><span>Central bank</span><strong>{percent(policy)}</strong><small>Today's policy rate</small></div><div className="lab-rate-connector" aria-hidden="true">→</div><div className="lab-rate-node"><span>Near-term borrowing</span><strong>Influenced</strong><small>Also depends on borrower risk</small></div></div>
    <div className="lab-long-rate"><div><span>Simplified long-term yield</span><strong>{percent(longYield)}</strong></div><div className="lab-yield-parts" role="img" aria-label={`${percent(futureReal)} expected real short rates plus ${percent(inflation)} expected inflation plus ${percent(premium)} term premium equals ${percent(longYield)}.`}><span style={{ flex: futureReal || .03 }} className="lab-yield-real"/><span style={{ flex: inflation || .03 }} className="lab-yield-inflation"/><span style={{ flex: premium || .03 }} className="lab-yield-premium"/></div><p>{percent(futureReal)} real rates + {percent(inflation)} expected inflation + {percent(premium)} term premium</p></div>
    <div className="lab-controls"><Slider label="Policy rate today" value={policy} onChange={setPolicy} min={0} max={8} step={.25} format={percent}/><Slider label="Expected average future real short rate" value={futureReal} onChange={setFutureReal} min={0} max={4} step={.25} format={percent}/><Slider label="Expected average inflation" value={inflation} onChange={setInflation} min={0} max={6} step={.25} format={percent}/><Slider label="Term premium" value={premium} onChange={setPremium} min={0} max={2} step={.25} format={percent}/></div>
    <Note>{longYield < policy ? "The long-term yield is below today's policy rate in this example. That is possible when markets price lower future rates." : 'A policy-rate cut need not reduce long-term yields. Future rate expectations, expected inflation, and the term premium can move differently.'}</Note>
    <p className="lab-assumption">Illustrative approximation, not a forecast. Expected real short rates + expected inflation + total term premium. Sliders move independently to isolate each idea. Policy can also change expectations. The term premium includes compensation for uncertain future rates and inflation; it can be negative, but this exercise uses nonnegative values.</p>
  </>;
}

const marketScenarios = {
  expansion: { name: 'Growth year', description: 'Business profits rise. Bonds and cash earn modest positive returns.', stocks: 15, bonds: 4, cash: 2 },
  recession: { name: 'Recession', description: 'Stocks fall while high-quality bonds rise in this invented scenario.', stocks: -30, bonds: 8, cash: 2 },
  inflation: { name: 'Inflation shock', description: 'Stocks and bonds fall together. Cash has a positive nominal return.', stocks: -25, bonds: -12, cash: 2 },
} as const;

function DiversificationLab() {
  const [stocks, setStocks] = useState(60);
  const [bonds, setBonds] = useState(30);
  const [scenarioId, setScenarioId] = useState<keyof typeof marketScenarios>('recession');
  const scenario = marketScenarios[scenarioId];
  const allocation = { stocks, bonds, cash: 100 - stocks - bonds };
  const change = weightedPortfolioReturn(allocation, scenario);
  const allocations = [{ key: 'stocks', label: 'Stocks', weight: stocks, color: teal }, { key: 'bonds', label: 'Bonds', weight: bonds, color: blue }, { key: 'cash', label: 'Cash', weight: allocation.cash, color: '#c3b29a' }] as const;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">Portfolio stress test</span><h3>Different assets. Shared risks.</h3><p>Build a $10,000 practice portfolio, then put it through an invented market year.</p></div>
    <div className="lab-choice-group" role="group" aria-label="Market scenario">{Object.entries(marketScenarios).map(([key, value]) => <button key={key} aria-pressed={scenarioId === key} onClick={() => setScenarioId(key as keyof typeof marketScenarios)}>{value.name}</button>)}</div>
    <p className="lab-scenario-description">{scenario.description}</p>
    <div className="lab-portfolio-result"><div><span>Portfolio after one year</span><strong>{money(10000 * (1 + change / 100))}</strong></div><span className={change < 0 ? 'lab-negative' : 'lab-positive'}>{signedPercent(change)}</span></div>
    <div className="lab-allocation-bar" role="img" aria-label={`Allocation: ${stocks}% stocks, ${bonds}% bonds, ${allocation.cash}% cash. Total 100%.`}>{allocations.filter(item => item.weight > 0).map(item => <span key={item.key} style={{ width: `${item.weight}%`, background: item.color }}/>)}</div>
    <div className="lab-allocation-legend">{allocations.map(item => <span key={item.key}><i style={{ background: item.color }}/>{item.label} <strong>{item.weight}%</strong></span>)}</div>
    <div className="lab-controls"><Slider label="Stocks" value={stocks} onChange={value => { setStocks(value); setBonds(current => Math.min(current, 100 - value)); }} min={0} max={100} step={5} format={value => `${value}%`}/><Slider label="Bonds" value={bonds} onChange={setBonds} min={0} max={100 - stocks} step={5} format={value => `${value}%`} help="Cash receives the remainder. Increasing stocks reduces bonds only if the total would exceed 100%."/></div>
    <table className="lab-scenario-table"><caption>How each holding contributes to the result</caption><thead><tr><th>Asset</th><th>Scenario return</th><th>Gain / loss</th></tr></thead><tbody>{allocations.map(item => <tr key={item.key}><th scope="row">{item.label}</th><td>{signedPercent(scenario[item.key])}</td><td className={scenario[item.key] < 0 && item.weight > 0 ? 'lab-negative' : ''}>{scenario[item.key] < 0 && item.weight > 0 ? '−' : ''}{money(Math.abs(10000 * item.weight / 100 * scenario[item.key] / 100))}</td></tr>)}</tbody></table>
    <Note>{scenarioId === 'inflation' ? 'Diversification does not eliminate losses. Stocks and bonds can fall in the same year. Cash can lose purchasing power even when its dollar balance rises.' : 'Diversification spreads exposure across risks. The outcome still depends on what you own, how much you own, and what happens in markets.'}</Note>
    <p className="lab-assumption">Invented one-year total returns, with income reinvested. No taxes, fees, rebalancing, or inflation adjustment. Allocations are examples, not suggested portfolios.</p>
  </>;
}

function FeesLab() {
  const [feeA, setFeeA] = useState(.2);
  const [feeB, setFeeB] = useState(2);
  const [years, setYears] = useState(25);
  const [gross, setGross] = useState(6);
  const first = feeProjection(10000, gross, feeA, years);
  const second = feeProjection(10000, gross, feeB, years);
  const a = first.at(-1)!.balance;
  const b = second.at(-1)!.balance;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">The cost of investing</span><h3>Small percentages add up.</h3><p>Start with $10,000 in each account. Give both the same gross return, then change the fees.</p></div>
    <div className="lab-big-number"><strong>{money(Math.abs(a - b))}</strong><span>Difference in ending balances after {years} years</span></div>
    <LineChart title="Equal investments with different annual fees" description={`Account A charges ${percent(feeA, 2)} per year and ends at ${money(a)}. Account B charges ${percent(feeB, 2)} and ends at ${money(b)}. Both earn the same ${percent(gross)} gross return.`} lines={[
      { label: `A · ${percent(feeA, 2)} fee`, color: teal, values: first.map(point => ({ x: point.year, y: point.balance })) },
      { label: `B · ${percent(feeB, 2)} fee`, color: rose, values: second.map(point => ({ x: point.year, y: point.balance })) },
    ]}/>
    <div className="lab-metric-pair"><div><span>Account A</span><strong>{money(a)}</strong></div><div><span>Account B</span><strong>{money(b)}</strong></div></div>
    <div className="lab-controls lab-controls-two"><Slider label="Account A annual fee" value={feeA} onChange={setFeeA} min={0} max={3} step={.05} format={value => percent(value, 2)}/><Slider label="Account B annual fee" value={feeB} onChange={setFeeB} min={0} max={3} step={.05} format={value => percent(value, 2)}/><Slider label="Years invested" value={years} onChange={setYears} min={1} max={40} format={value => `${value} years`}/><Slider label="Gross annual return" value={gross} onChange={setGross} min={-5} max={12} step={.5} format={percent}/></div>
    <Note>{feeA === feeB ? 'Equal fees and equal gross returns produce equal balances.' : 'The balance gap includes fees paid and the returns those dollars no longer earn.'} A higher fee does not guarantee a higher gross return.</Note>
    <p className="lab-assumption">Hypothetical constant return. Each year, balance × (1 + gross return) × (1 − annual fee). No additional contributions, taxes, transaction costs, or inflation. Real fee charging schedules vary.</p>
  </>;
}

const planChecks = [
  { id: 'buffer', label: 'I have separated money for bills and emergencies.' },
  { id: 'debt', label: 'I have reviewed my debt costs before investing.' },
  { id: 'loss', label: 'I can explain how this investment could lose money.' },
  { id: 'fees', label: 'I know the fees and the relevant account tax rules.' },
  { id: 'concentration', label: 'I have checked for concentration in one company or sector.' },
] as const;

interface PracticePlan { goal: string; horizon: number; checks: string[]; rule: string }
const emptyPlan: PracticePlan = { goal: '', horizon: 10, checks: [], rule: '' };

function parsePracticePlan(raw: string | null): PracticePlan {
  try {
    if (!raw) return emptyPlan;
    const saved = JSON.parse(raw) as Partial<PracticePlan> | null;
    if (!saved || typeof saved !== 'object') return emptyPlan;
    return {
      goal: typeof saved.goal === 'string' ? saved.goal.slice(0, 100) : '',
      horizon: typeof saved.horizon === 'number' && Number.isInteger(saved.horizon) && saved.horizon >= 1 && saved.horizon <= 40 ? saved.horizon : 10,
      checks: Array.isArray(saved.checks) ? saved.checks.filter((id): id is string => typeof id === 'string' && planChecks.some(check => check.id === id)) : [],
      rule: typeof saved.rule === 'string' ? saved.rule.slice(0, 400) : '',
    };
  } catch { return emptyPlan; }
}

function PlanLab() {
  const id = useId();
  const [plan, updatePlan, status, retrySaving, , ready] = useBrowserRecord(planStorageKey, parsePracticePlan);
  const completed = planChecks.filter(check => plan.checks.includes(check.id)).length;
  return <>
    <div className="lab-heading"><span className="lab-eyebrow">Your practice plan</span><h3>Turn the lesson into a decision.</h3><p>Write down why you're investing and what you still need to understand.</p></div>
    <div className="lab-plan-field"><label htmlFor={`${id}-goal`}>What is this money for?</label><input disabled={!ready} id={`${id}-goal`} type="text" placeholder="For example, retirement or a home deposit" maxLength={100} value={plan.goal} onChange={event => { const goal = event.target.value; updatePlan(current => ({ ...current, goal })); }}/></div>
    <div className="lab-controls"><Slider disabled={!ready} label="When you expect to need it" value={plan.horizon} onChange={value => updatePlan(current => ({ ...current, horizon: value }))} min={1} max={40} format={value => `${value} ${value === 1 ? 'year' : 'years'}`}/></div>
    <Note>{plan.horizon <= 3 ? 'With a short deadline, a market drop near your withdrawal date can leave too little time to recover. Study access to cash and loss risk before choosing an investment.' : 'A longer horizon gives investments more time, but recovery is never guaranteed. Decide what loss you could tolerate without abandoning the plan.'}</Note>
    <fieldset className="lab-plan-checks"><legend>Before I commit money</legend>{planChecks.map(check => <label key={check.id}><input disabled={!ready} type="checkbox" checked={plan.checks.includes(check.id)} onChange={event => { const checked = event.target.checked; updatePlan(current => ({ ...current, checks: checked ? [...new Set([...current.checks, check.id])] : current.checks.filter(item => item !== check.id) })); }}/><span>{check.label}</span></label>)}</fieldset>
    <div className="lab-plan-field"><label htmlFor={`${id}-rule`}>My rule for a market drop</label><textarea disabled={!ready} id={`${id}-rule`} placeholder="Write what you will review before changing your plan." maxLength={400} rows={3} value={plan.rule} onChange={event => { const rule = event.target.value; updatePlan(current => ({ ...current, rule })); }}/></div>
    <div className="lab-plan-summary"><span className="lab-eyebrow">Your worksheet</span><h4>{plan.goal.trim() || 'Name your goal above'}</h4><p>{plan.horizon}-year horizon · {completed} of {planChecks.length} checks reviewed</p><p>{completed === planChecks.length ? 'Your checklist is filled in. Verify the actual investment and account details before acting.' : `${planChecks.length - completed} checks remain. Use them to choose what to learn next.`}</p></div>
    <p className="lab-assumption" role="status">{status === 'saved' ? 'Draft saved in this browser. This worksheet does not choose investments for you.' : status === 'error' ? ready ? 'Your draft could not be saved. Keep this page open and retry.' : 'Your saved plan could not be loaded. Retry before editing.' : ready ? 'Saving draft…' : 'Loading draft…'}{status === 'error' && <> <button className="academy-text-button" onClick={() => void retrySaving()}>{ready ? 'Retry saving' : 'Retry loading'}</button></>}</p>
  </>;
}

const labs: Record<string, () => ReactNode> = {
  foundation: FoundationsLab, assets: AssetsLab, compounding: CompoundingLab, stocks: StocksLab,
  bonds: BondsLab, economy: EconomyLab, diversification: DiversificationLab, fees: FeesLab, plan: PlanLab,
};

export default function LearningLab({ lessonId }: { lessonId: string }) {
  const Lab = labs[lessonId] ?? FoundationsLab;
  return <div className={`learning-lab lab-${lessonId}`}><Lab key={lessonId}/></div>;
}
