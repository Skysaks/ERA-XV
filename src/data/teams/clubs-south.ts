import { team } from '../schema';

/** Irish provinces (URC / Celtic League) and Super Rugby franchises. */
export default [
  team({ id: 'munster-2007', team: 'munster', name: 'Munster', era: '2006–08', years: [2006, 2008], kind: 'club', country: 'IRL', comp: 'urc', color: '#d33b3b', titles: ['euro:2006', 'euro:2008'], plan: 'pack' }, `
Christian Cullen | FB | 84 | FC | NZL
Shaun Payne | FB | 82 | FS | IRL
Ian Dowling | WG | 81 | WF | IRL
Anthony Horgan | WG | 81 | WF | IRL
Doug Howlett | WG | 87 | WF | NZL
Rua Tipoki | OC | 83 | 13D | NZL
Trevor Halstead | OC | 82 | 13D | RSA
Lifeimi Mafi | IC | 83 | 12C | TON
Ronan O'Gara | FH | 90 | 10G | IRL gk=91 kk=93
Peter Stringer | SH | 84 | 9T | IRL
Tomás O'Leary | SH | 83 | 9K | IRL
Marcus Horan | LHP | 84 | PS | IRL
Jerry Flannery | HK | 86 | HD | IRL
Frankie Sheahan | HK | 82 | HS | IRL
John Hayes | THP | 85 | PS | IRL
Federico Pucciariello | THP/LHP | 81 | PS | ITA
Paul O'Connell | LK | 93 | LC | IRL
Donncha O'Callaghan | LK | 86 | LE | IRL
Mick O'Driscoll | LK | 81 | LC | IRL
Alan Quinlan | BF | 83 | FT | IRL
David Wallace | OF | 88 | FT | IRL
Denis Leamy | N8/BF | 85 | NP | IRL
Anthony Foley | N8 | 86 | NF | IRL
`),

  team({ id: 'leinster-2011', team: 'leinster', name: 'Leinster', era: '2009–12', years: [2009, 2012], kind: 'club', country: 'IRL', comp: 'urc', color: '#3f6fd6', titles: ['euro:2009', 'euro:2011', 'euro:2012'], plan: 'balanced' }, `
Rob Kearney | FB | 88 | FS | IRL ae=94
Isa Nacewa | WG/FB | 86 | FC | FIJ gk=82
Shane Horgan | WG | 84 | WP | IRL
Luke Fitzgerald | WG | 84 | WF | IRL
Fergus McFadden | WG/IC | 82 | WP | IRL
Brian O'Driscoll | OC | 95 | 13B | IRL
Gordon D'Arcy | IC | 86 | 12C | IRL
Johnny Sexton | FH | 91 | 10G | IRL gk=88
Felipe Contepomi | FH/IC | 86 | 10R | ARG gk=86 short=F. Contepomi
Chris Whitaker | SH | 83 | 9T | AUS
Eoin Reddan | SH | 83 | 9T | IRL
Isaac Boss | SH | 81 | 9S | IRL
Cian Healy | LHP | 86 | PC | IRL
Richardt Strauss | HK | 83 | HD | IRL
Bernard Jackman | HK | 81 | HS | IRL
Mike Ross | THP | 84 | PS | IRL
Leo Cullen | LK | 85 | LC | IRL
Nathan Hines | LK | 84 | LE | SCO
Malcolm O'Kelly | LK | 83 | LC | IRL
Devin Toner | LK | 82 | LC | IRL
Brad Thorn | LK | 86 | LE | NZL
Rocky Elsom | BF | 89 | FT | AUS
Kevin McLaughlin | BF | 81 | FT | IRL
Sean O'Brien | OF | 90 | FT | IRL cr=92
Shane Jennings | OF | 83 | FJ | IRL
Jamie Heaslip | N8 | 89 | NF | IRL
`),

  team({ id: 'leinster-2018', team: 'leinster', name: 'Leinster', era: '2017–18', years: [2017, 2018], kind: 'club', country: 'IRL', comp: 'urc', color: '#3f6fd6', titles: ['euro:2018'], plan: 'tempo' }, `
Rob Kearney | FB | 86 | FS | IRL ae=93
Jordan Larmour | FB/WG | 84 | FC | IRL
Isa Nacewa | WG | 85 | WA | FIJ gk=82
James Lowe | WG | 86 | WP | IRL
Adam Byrne | WG | 81 | WF | IRL
Fergus McFadden | WG | 81 | WP | IRL
Garry Ringrose | OC | 87 | 13B | IRL
Robbie Henshaw | IC/OC | 86 | 12C | IRL
Johnny Sexton | FH | 94 | 10G | IRL gk=89 kk=94
Ross Byrne | FH | 82 | 10G | IRL gk=84
Joey Carbery | FH/FB | 83 | 10R | IRL gk=80
Luke McGrath | SH | 83 | 9T | IRL
Jamison Gibson-Park | SH | 82 | 9T | IRL
Cian Healy | LHP | 87 | PC | IRL
Jack McGrath | LHP | 84 | PS | IRL
Seán Cronin | HK | 84 | HD | IRL
James Tracy | HK | 81 | HS | IRL
Tadhg Furlong | THP | 92 | PC | IRL
Andrew Porter | THP | 82 | PC | IRL
Devin Toner | LK | 84 | LC | IRL
James Ryan | LK | 88 | LA | IRL
Scott Fardy | LK/BF | 85 | F6 | AUS
Rhys Ruddock | BF | 82 | FT | IRL
Jordi Murphy | BF | 83 | FT | IRL
Dan Leavy | OF | 87 | FT | IRL
Josh van der Flier | OF | 85 | FT | IRL
Jack Conan | N8 | 84 | NP | IRL
`),

  team({ id: 'leinster-2024', team: 'leinster', name: 'Leinster', era: '2022–25', years: [2022, 2025], kind: 'club', country: 'IRL', comp: 'urc', color: '#3f6fd6', titles: ['urc:2025'], plan: 'tempo' }, `
Hugo Keenan | FB | 88 | FS | IRL
Jamie Osborne | FB/OC | 82 | FC | IRL
James Lowe | WG | 88 | WP | IRL
Jordan Larmour | WG/FB | 83 | FC | IRL
Jimmy O'Brien | WG/FB | 82 | WA | IRL
Garry Ringrose | OC | 88 | 13D | IRL
Robbie Henshaw | IC | 86 | 12C | IRL
Jordie Barrett | IC | 88 | 12C | NZL gk=84
Johnny Sexton | FH | 91 | 10G | IRL gk=88 kk=93
Ross Byrne | FH | 83 | 10G | IRL gk=85
Sam Prendergast | FH | 84 | 10R | IRL gk=82
Jamison Gibson-Park | SH | 90 | 9T | IRL
Luke McGrath | SH | 82 | 9T | IRL
Andrew Porter | LHP | 90 | PC | IRL
Cian Healy | LHP | 83 | PC | IRL
Dan Sheehan | HK | 91 | HD | IRL pc=78
Rónan Kelleher | HK | 86 | HD | IRL
Tadhg Furlong | THP | 90 | PC | IRL
Michael Alaalatoa | THP | 81 | PS | SAM
James Ryan | LK | 88 | LA | IRL
Joe McCarthy | LK | 88 | LE | IRL
Jason Jenkins | LK | 82 | LE | RSA
RG Snyman | LK | 86 | LA | RSA
Ryan Baird | LK/BF | 84 | LA | IRL
Josh van der Flier | OF | 91 | FT | IRL
Jack Conan | N8 | 86 | NP | IRL
Caelan Doris | N8 | 92 | NF | IRL
`),

  team({ id: 'crusaders-1999', team: 'crusaders', name: 'Crusaders', era: '1998–2000', years: [1998, 2000], kind: 'club', country: 'NZL', comp: 'super', color: '#d8343f', titles: ['super:1998', 'super:1999', 'super:2000'], plan: 'balanced', conf: 'medium' }, `
Leon MacDonald | FB/OC | 84 | FS | NZL gk=80
Afato So'oalo | WG | 83 | WF | SAM
Marika Vunibaka | WG | 84 | WF | FIJ
Caleb Ralph | WG | 83 | WF | NZL
Norm Berryman | WG/OC | 82 | WP | NZL
Mark Mayerhofler | OC | 82 | 13D | NZL
Daryl Gibson | IC | 83 | 12C | NZL
Aaron Mauger | IC | 84 | 12P | NZL
Andrew Mehrtens | FH | 91 | 10G | NZL gk=92
Justin Marshall | SH | 88 | 9S | NZL
Greg Feek | LHP | 82 | PS | NZL
Mark Hammett | HK | 83 | HS | NZL
Greg Somerville | THP | 85 | PS | NZL
Norm Maxwell | LK | 85 | LE | NZL
Chris Jack | LK | 85 | LC | NZL
Todd Blackadder | BF/LK | 85 | LE | NZL
Reuben Thorne | OF/BF | 86 | F6 | NZL
Scott Robertson | N8/BF | 84 | FL | NZL
`),

  team({ id: 'crusaders-2006', team: 'crusaders', name: 'Crusaders', era: '2005–08', years: [2005, 2008], kind: 'club', country: 'NZL', comp: 'super', color: '#d8343f', titles: ['super:2005', 'super:2006', 'super:2008'], plan: 'balanced' }, `
Leon MacDonald | FB | 86 | FS | NZL gk=82
Rico Gear | WG | 86 | WF | NZL
Caleb Ralph | WG | 83 | WF | NZL
Scott Hamilton | WG | 82 | WF | NZL
Casey Laulala | OC | 83 | 13D | NZL
Aaron Mauger | IC | 87 | 12P | NZL
Dan Carter | FH | 98 | 10R | NZL gk=94
Stephen Brett | FH | 81 | 10R | NZL
Justin Marshall | SH | 87 | 9S | NZL
Andy Ellis | SH | 83 | 9T | NZL
Wyatt Crockett | LHP | 82 | PS | NZL
Corey Flynn | HK | 83 | HD | NZL
Greg Somerville | THP | 85 | PS | NZL
Ben Franks | THP | 81 | PS | NZL
Chris Jack | LK | 88 | LC | NZL
Brad Thorn | LK | 88 | LE | NZL
Ross Filipo | LK | 82 | LA | NZL
Reuben Thorne | BF | 86 | F6 | NZL
Richie McCaw | OF | 97 | FJ | NZL bd=98
Mose Tuiali'i | N8 | 84 | NP | NZL
Kieran Read | N8/BF | 85 | NF | NZL
`),

  team({ id: 'crusaders-2019', team: 'crusaders', name: 'Crusaders', era: '2017–23', years: [2017, 2023], kind: 'club', country: 'NZL', comp: 'super', color: '#d8343f', titles: ['super:2017', 'super:2018', 'super:2019', 'super:2020', 'super:2021', 'super:2022', 'super:2023'], plan: 'balanced' }, `
David Havili | FB/IC | 85 | FC | NZL
Will Jordan | FB/WG | 90 | WF | NZL
Sevu Reece | WG | 86 | WF | NZL
George Bridge | WG | 85 | WF | NZL
Leicester Fainga'anuku | WG | 85 | WP | NZL
Braydon Ennor | OC | 83 | 13B | NZL
Jack Goodhue | OC | 85 | 13D | NZL
Ryan Crotty | IC | 85 | 12P | NZL
Richie Mo'unga | FH | 91 | 10R | NZL gk=86
Bryn Hall | SH | 82 | 9T | NZL
Mitchell Drummond | SH | 82 | 9T | NZL
Joe Moody | LHP | 87 | PS | NZL
George Bower | LHP | 83 | PC | NZL
Codie Taylor | HK | 89 | HD | NZL
Owen Franks | THP | 87 | PS | NZL
Michael Alaalatoa | THP | 83 | PS | SAM
Fletcher Newell | THP | 82 | PS | NZL
Sam Whitelock | LK | 91 | LC | NZL
Scott Barrett | LK | 89 | LE | NZL
Luke Romano | LK | 83 | LE | NZL
Mitchell Dunshea | LK | 81 | LC | NZL
Jordan Taufua | BF | 83 | FT | NZL
Ethan Blackadder | BF | 83 | FT | NZL
Pablo Matera | BF | 85 | FT | ARG
Matt Todd | OF | 86 | FJ | NZL
Tom Christie | OF | 83 | FJ | NZL
Kieran Read | N8 | 91 | NF | NZL
Cullen Grace | BF/N8 | 82 | NF | NZL
Whetu Douglas | N8 | 81 | NP | NZL
`),

  team({ id: 'blues-1997', team: 'blues', name: 'Blues', era: '1996–97', years: [1996, 1997], kind: 'club', country: 'NZL', comp: 'super', color: '#3a73d9', titles: ['super:1996', 'super:1997'], plan: 'flair' }, `
Adrian Cashmore | FB | 83 | FS | NZL gk=84
Jeremy Stanley | FB/WG | 81 | FC | NZL conf=medium
Jonah Lomu | WG | 94 | WP | NZL
Joeli Vidiri | WG | 87 | WF | NZL
Eroni Clarke | IC | 83 | 12C | NZL
Lee Stensness | OC/IC | 83 | 13D | NZL
Carlos Spencer | FH | 89 | 10R | NZL gk=82
Ofisa Tonu'u | SH | 83 | 9S | NZL
Craig Dowd | LHP | 87 | PS | NZL
Sean Fitzpatrick | HK | 92 | HD | NZL
Olo Brown | THP | 89 | PS | NZL
Robin Brooke | LK | 88 | LE | NZL
Charles Riechelmann | LK/BF | 82 | LE | NZL
Michael Jones | BF | 88 | FT | NZL short=M. Jones
Andrew Blowers | BF | 82 | FT | NZL
Mark Carter | OF | 81 | FT | NZL conf=medium
Zinzan Brooke | N8 | 93 | NF | NZL
`),

  team({ id: 'brumbies-2002', team: 'brumbies', name: 'Brumbies', era: '2000–04', years: [2000, 2004], kind: 'club', country: 'AUS', comp: 'super', color: '#2f5fb8', titles: ['super:2001', 'super:2004'], plan: 'tempo' }, `
Andrew Walker | FB/WG | 84 | FC | AUS gk=82
Joe Roff | WG | 87 | WA | AUS
Clyde Rathbone | WG | 82 | WF | AUS
Stirling Mortlock | OC | 88 | 13D | AUS gk=85
Matt Giteau | IC/SH | 85 | 12P | AUS
Rod Kafer | IC | 83 | 12P | AUS
Stephen Larkham | FH | 93 | 10R | AUS
George Gregan | SH | 91 | 9T | AUS
Bill Young | LHP | 83 | PS | AUS
Jeremy Paul | HK | 85 | HD | AUS
Ben Darwin | THP | 82 | PS | AUS
Patricio Noriega | THP | 82 | PS | AUS
Justin Harrison | LK | 84 | LC | AUS
David Giffin | LK | 83 | LE | AUS
Owen Finegan | BF | 85 | FT | AUS
George Smith | OF | 91 | FJ | AUS bd=96
Jim Williams | N8/BF | 83 | NF | AUS short=Jim Williams
Radike Samo | N8/LK | 82 | NP | AUS
`),

  team({ id: 'bulls-2009', team: 'bulls', name: 'Bulls', era: '2007–10', years: [2007, 2010], kind: 'club', country: 'RSA', comp: 'super', color: '#3a64c9', titles: ['super:2007', 'super:2009', 'super:2010'], plan: 'territory', conf: 'medium' }, `
Zane Kirchner | FB | 84 | FS | RSA
Akona Ndungane | WG | 82 | WF | RSA
Bryan Habana | WG | 92 | WF | RSA pc=98
Francois Hougaard | SH/WG | 82 | 9S | RSA
Wynand Olivier | OC/IC | 84 | 12C | RSA
Jaco Pretorius | IC | 80 | 12C | RSA conf=low
Morné Steyn | FH | 88 | 10G | RSA gk=92
Derick Hougaard | FH | 83 | 10G | RSA gk=86
Fourie du Preez | SH | 94 | 9K | RSA
Gurthrö Steenkamp | LHP | 84 | PS | RSA
Gary Botha | HK | 83 | HS | RSA
Chiliboy Ralepelle | HK | 81 | HS | RSA
Bees Roux | THP | 81 | PS | RSA
Werner Kruger | THP | 81 | PS | RSA
Bakkies Botha | LK | 90 | LE | RSA
Victor Matfield | LK | 94 | LC | RSA lo=98
Danie Rossouw | LK/N8 | 85 | NP | RSA
Pedrie Wannenburg | BF | 84 | FT | RSA
Dewald Potgieter | BF | 82 | FT | RSA
Deon Stegmann | OF | 83 | FJ | RSA
Pierre Spies | N8 | 87 | NP | RSA
`),

  team({ id: 'chiefs-2012', team: 'chiefs', name: 'Chiefs', era: '2012–13', years: [2012, 2013], kind: 'club', country: 'NZL', comp: 'super', color: '#e2b93b', titles: ['super:2012', 'super:2013'], plan: 'tempo', conf: 'medium' }, `
Gareth Anscombe | FB/FH | 82 | FS | WAL gk=84
Robbie Robinson | FB | 81 | FC | NZL
Tim Nanai-Williams | FB/WG | 82 | FC | SAM
Lelia Masaga | WG | 83 | WF | NZL
Asaeli Tikoirotuma | WG | 82 | WF | FIJ
Richard Kahui | OC | 84 | 13D | NZL
Sonny Bill Williams | IC | 88 | 12C | NZL short=S.B. Williams
Andrew Horrell | IC | 81 | 12C | NZL
Aaron Cruden | FH | 87 | 10R | NZL gk=82
Tawera Kerr-Barlow | SH | 83 | 9S | NZL
Brendon Leonard | SH | 81 | 9S | NZL
Sona Taumalolo | LHP | 81 | PS | TON
Hika Elliot | HK | 82 | HD | NZL
Mahonri Schwalger | HK | 81 | HS | SAM
Ben Tameifuna | THP | 82 | PC | TON
Craig Clarke | LK | 85 | LC | NZL
Brodie Retallick | LK | 88 | LA | NZL
Michael Fitzgerald | LK | 81 | LE | NZL
Liam Messam | BF | 86 | FT | NZL
Tanerau Latimer | OF | 83 | FJ | NZL
Sam Cane | OF | 85 | FT | NZL
Kane Thompson | N8 | 82 | NP | NZL
`),

  team({ id: 'waratahs-2014', team: 'waratahs', name: 'Waratahs', era: '2014', years: [2014, 2014], kind: 'club', country: 'AUS', comp: 'super', color: '#6fb3ea', titles: ['super:2014'], plan: 'flair' }, `
Israel Folau | FB | 91 | FC | AUS ae=94
Kurtley Beale | FB/IC | 86 | FC | AUS
Alofa Alofa | WG | 81 | WF | AUS
Peter Betham | WG | 81 | WF | AUS
Adam Ashley-Cooper | OC/WG | 86 | 13D | AUS
Rob Horne | IC/OC | 83 | 12C | AUS
Bernard Foley | FH | 87 | 10G | AUS gk=86
Nick Phipps | SH | 82 | 9S | AUS
Benn Robinson | LHP | 83 | PS | AUS
Tatafu Polota-Nau | HK | 85 | HD | AUS
Sekope Kepu | THP | 86 | PS | AUS
Paddy Ryan | THP | 81 | PS | AUS
Will Skelton | LK | 85 | LE | AUS
Kane Douglas | LK | 84 | LE | AUS
Jacques Potgieter | BF | 83 | FT | RSA
Dave Dennis | BF | 82 | FT | AUS
Michael Hooper | OF | 91 | FJ | AUS
Wycliff Palu | N8 | 85 | NP | AUS
`),

  team({ id: 'hurricanes-2016', team: 'hurricanes', name: 'Hurricanes', era: '2016–17', years: [2016, 2017], kind: 'club', country: 'NZL', comp: 'super', color: '#f0c419', titles: ['super:2016'], plan: 'flair' }, `
Jordie Barrett | FB | 86 | FS | NZL gk=84
Nehe Milner-Skudder | WG/FB | 85 | WF | NZL
Julian Savea | WG | 88 | WP | NZL
Cory Jane | WG | 84 | WA | NZL
Vince Aso | OC | 83 | 13B | NZL
Matt Proctor | OC | 82 | 13D | NZL
Ngani Laumape | IC | 85 | 12C | NZL
Beauden Barrett | FH | 95 | 10R | NZL gk=82 pc=95
James Marshall | FH/FB | 81 | 10G | NZL
TJ Perenara | SH | 89 | 9S | NZL
Loni Uhila | LHP | 81 | PS | TON
Dane Coles | HK | 91 | HD | NZL pc=86
Ricky Riccitelli | HK | 81 | HD | NZL
Jeffery Toomaga-Allen | THP | 83 | PS | NZL
Ben May | THP | 82 | PS | NZL
Michael Fatialofa | LK | 82 | LE | NZL
Mark Abbott | LK | 81 | LC | NZL
Vaea Fifita | LK/BF | 83 | LA | NZL
Brad Shields | BF | 84 | FT | NZL
Ardie Savea | OF | 89 | FL | NZL
Callum Gibbins | OF | 82 | FJ | NZL
Victor Vito | N8 | 84 | NP | NZL
Blade Thomson | N8 | 82 | NF | NZL
`),
];
