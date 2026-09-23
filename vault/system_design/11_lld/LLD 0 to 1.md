
```table-of-contents
title: 
style: nestedList # TOC style (nestedList|nestedOrderedList|inlineFirstLevel)
minLevel: 0 # Include headings from the specified level
maxLevel: 0 # Include headings up to the specified level
include: 
exclude: 
includeLinks: true # Make headings clickable
hideWhenEmpty: false # Hide TOC if no headings are found
debugInConsole: false # Print debug info in Obsidian console
```
### phase wise learning
![[Pasted image 20260401225433.png|L|600]]
##### phase 0
![[Pasted image 20260409114753.png|L|600]]
##### phase 1

![[Pasted image 20260409114836.png|L|600]]
##### phase 2
![[Pasted image 20260409115015.png|L|600]]
##### phase 3 

![[Pasted image 20260409115051.png|L|600]]

- User action → Manager/Controller (dependency)
                    ↓
              Resource class (composition from container)
                    ↓
              Bridge class/Ticket (aggregation)
                    ↓
              Financial records: Payment, Fine (aggregation)

##### phase 4 
![[Pasted image 20260409115121.png|L|600]]
##### phase 5 
![[Pasted image 20260409115145.png|L|600]]

- **Solid line + filled diamond** → Composition (Building→Elevator, Building→Floor, Elevator→ElevatorState)
- **Dashed line + open diamond** → Aggregation (Controller→Elevator, Elevator→ElevatorRequest)
- **Dotted line + open arrow** → Dependency (Controller→SchedulingStrategy)
- **Solid line + open triangle** → Inheritance/implements (all State classes → ElevatorState interface)

### API Design
	
![[Pasted image 20260409211245.png|L|600]]

### DB design

![[Pasted image 20260409211320.png|L|600]]

#### cheatsheet (db+api design)

![[Pasted image 20260409211357.png|L|600]]

### Common Trade offs
![[Pasted image 20260409211438.png|L|600]]

### Extensibility Notes

![[Pasted image 20260409211503.png|L|600]]
### common 

- enums
	- ![[Pasted image 20260404153209.png|L|600]]
- ![[Pasted image 20260409102024.png|L|600]]
- ![[Pasted image 20260409102607.png|L|600]]