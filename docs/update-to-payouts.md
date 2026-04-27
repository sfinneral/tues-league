# New weekly payments per division

* I would like to be able to customize the payouts per division. 
* The admin functionality to configure this can be set here /Users/sfinneral/Documents/repos/tues-league/app/routes/_p.admin.$league.divisions.tsx
* I would like the ability to configure how many places are being paid out and how much. Have 3rd place be the max for now
* Here is an example: 
Divison 1
1st place: $200
2nd place: $60
3rd place: $40
Division 2
1st place: $200
2nd place: $60
* If no custom payouts have been set. the default should be:
1st place: $175
2nd place: $50


* Here are some tie rules. Some of this time logic already exists but we are now adding the ability to add a third place payout.
* I'll use this example:
Divison 1
1. $200
2. $60
3. $40

### Tie rules
* 2-way tie for first
1. 130 
1. 130
3. 40

* 3-way tie for first
1. 100
1. 100
1. 100

* 4-way tie for first (same logic applies for 5-way,6-way etc.)
1. 75
1. 75
1. 75
1. 75

* 2-way tie for second
1. 200 
2. 50
2. 50

* 3-way tie for second  (same logic applies for 4-way,5-way etc.)
1. 200 
2. 33.33
2. 33.33
2. 33.33

* 2-way tie for first and 2-way tie for third
1. 130 
1. 130
3. 20
3. 20