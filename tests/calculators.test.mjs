import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('dist/assets/app.js','utf8');
const core=source.slice(source.indexOf('const money='),source.indexOf('document.addEventListener("DOMContentLoaded"'));
const cases=[
['unit-price-compare',{aPrice:12,aQty:24,bPrice:8,bQty:10},'Option A is cheaper'],
['bulk-buy-checker',{smallPrice:6,smallQty:12,bulkPrice:18,bulkQty:40},'Option B is cheaper'],
['sale-price-calculator',{price:80,discount:25},'Final price: $60.00'],
['discount-stacking-calculator',{price:100,d1:20,d2:10},'Final price: $72.00'],
['price-per-use',{price:120,uses:150},'$0.80 per use'],
['overtime-pay',{rate:20,hours:45},'Estimated gross pay: $950.00'],
['hourly-to-salary',{rate:25,hours:40},'About $52,000.00 per year'],
['raise-impact',{current:20,newrate:21.5,hours:40},'Annual change: $3,120.00'],
['commute-cost',{miles:30,mpg:25,gas:3.5,days:20},'About $84.00 per month in fuel'],
['trip-fuel-cost',{miles:600,mpg:30,gas:3.4},'Fuel estimate: $68.00'],
['fuel-cost-per-mile',{mpg:25,gas:3.5},'$0.14 per mile in fuel'],
['savings-goal',{goal:5000,have:2000,months:12},'Save $250.00 per month'],
['debt-payoff',{balance:1200,apr:0,payment:100},'About 12 months to payoff'],
['tip-and-split',{bill:72,tip:18,people:4},'$21.24 per person'],
['subscription-true-cost',{monthly:14.99,months:36},'Total cost: $539.64'],
['rent-affordability',{monthlyIncome:5000,rent:1500},'Rent uses 30.0% of gross income'],
['meal-cost-per-serving',{cost:18,servings:6},'$3.00 per serving'],
['paint-calculator',{area:800,coats:2,coverage:400},'Buy about 4 gallons'],
['flooring-calculator',{area:200,waste:10,box:20},'Buy 11 boxes'],
['resale-profit',{sale:60,cost:25,fees:10,shipping:6},'Estimated profit: $23.00']
];
function calculate(id,values){const nodes={};const context=vm.createContext({Intl,document:{getElementById:key=>nodes[key]??={value:values[key]??'',textContent:'',classList:{add(){}}}}});vm.runInContext(core+'\nfunction enhanceResult(){}',context);vm.runInContext(`calculate(${JSON.stringify(id)})`,context);return nodes.headline.textContent;}
for(const[id,input,expected]of cases)test(id,()=>assert.equal(calculate(id,input),expected));
test('equal and zero prices do not create a false recommendation',()=>{assert.equal(calculate('unit-price-compare',{aPrice:5,aQty:10,bPrice:10,bQty:20}),'Same unit price');assert.equal(calculate('unit-price-compare',{aPrice:0,aQty:10,bPrice:0,bQty:20}),'Same unit price');});
test('zero divisors and excessive discounts are rejected',()=>{assert.equal(calculate('unit-price-compare',{aPrice:12,aQty:0,bPrice:8,bQty:10}),'Check your inputs');assert.equal(calculate('sale-price-calculator',{price:80,discount:101}),'Check your inputs');});
