/* London (Josh, Nov 27: "And the city of London"). Go to > Earth places > London: a sub-list like Boston & area (bostonarea.js FP_PLACESET).
   Each spot pins a Real Earth free anchor on the place (no city scene of ours is loaded) and shows a fact-checked public-history board.
   Labels say only "London" plus the landmark's own name. ?spot=ldn-<id> lands there; ?spot=london opens St Paul's. */
(function () {
'use strict';
const L = {yOff: -45.4, ground: 15};   // geoid ~ +45.4 m over London: the Google ground then sits at about its elevation
const SP = [   // id, menu label, lat, lon, frame, metres back, metres up, board title, board lines
  ['stpauls', "St Paul's Cathedral", 51.51379, -0.09845, L, 480, 190, "St Paul's Cathedral",
    ["Sir Christopher Wren's cathedral was built from 1675 to 1710, after the Great Fire of 1666 destroyed Old St Paul's.",
     'Its dome rises about 111 m. Winston Churchill\'s state funeral was held here in 1965, and the wedding of Prince Charles and Lady Diana Spencer in 1981.']],
  ['bank', 'Bank of England', 51.51416, -0.08894, L, 420, 170, 'Bank of England',
    ['Founded in 1694 to lend money to the government of William III, it has been on this site since 1734.',
     'Sir John Soane rebuilt it between 1788 and 1833; his outer wall still stands around the 1920s-30s building by Sir Herbert Baker.',
     'Across the junction is the Royal Exchange, first founded by Sir Thomas Gresham in 1565.']],
  ['towers', 'City towers', 51.51330, -0.08210, L, 650, 240, 'The City towers',
    ['30 St Mary Axe, "the Gherkin", by Norman Foster, opened in 2004 at 180 m.',
     'The Leadenhall Building, "the Cheesegrater" (Rogers Stirk Harbour, 2014), reaches about 225 m.',
     '20 Fenchurch Street, "the Walkie-Talkie" (Rafael Vinoly, 2014), has the Sky Garden at its top. In 2013 its curved glass focused sunlight hot enough to melt parts of a parked car.']],
  ['monument', 'The Monument', 51.51014, -0.08595, L, 380, 150, 'The Monument to the Great Fire',
    ['Designed by Christopher Wren and Robert Hooke and built in 1671-77, the column is 202 feet (61.6 m) tall.',
     'That is the distance from its base to the bakery where the Great Fire of 1666 began. 311 steps lead to the viewing platform.']],
  ['guildhall', 'Guildhall', 51.51591, -0.09202, L, 380, 150, 'Guildhall',
    ['Built between 1411 and 1440, it has been the City of London\'s town hall for six centuries.',
     'Lady Jane Grey was tried here in 1553. In 1988 the remains of a Roman amphitheatre were found beneath the yard.']],
  ['tower', 'Tower of London', 51.50822, -0.07619, L, 450, 170, 'Tower of London',
    ['William the Conqueror began the White Tower around 1078. It has served as fortress, palace, prison and royal mint.',
     'It keeps the Crown Jewels, guarded by the Yeoman Warders ("Beefeaters"), and its famous ravens. A World Heritage Site since 1988.']],
  ['towerbridge', 'Tower Bridge', 51.50552, -0.07537, L, 420, 140, 'Tower Bridge',
    ['Designed by Horace Jones and John Wolfe Barry, it opened in 1894.',
     'Its two bascules lift so tall ships can pass; they were first raised by steam-driven hydraulic engines.']],
  ['millennium', 'Millennium Bridge & Tate', 51.50989, -0.09851, L, 520, 180, 'Millennium Bridge & Tate Modern',
    ['The steel footbridge opened in June 2000 and closed two days later because it swayed underfoot ("the Wobbly Bridge"); it reopened in 2002.',
     'Tate Modern opened in 2000 in a former power station designed by Sir Giles Gilbert Scott.']],
  ['parliament', 'Parliament & Big Ben', 51.50069, -0.12457, L, 500, 180, 'Houses of Parliament & Big Ben',
    ['The Palace of Westminster was rebuilt after a fire in 1834, to designs by Charles Barry and Augustus Pugin.',
     'Big Ben is the Great Bell; its clock first ran in 1859. The clock tower was renamed Elizabeth Tower in 2012.',
     'Westminster Abbey nearby has crowned English and British monarchs since 1066.']],
  ['palace', 'Buckingham Palace', 51.50083, -0.14300, L, 500, 180, 'Buckingham Palace',
    ['George III bought it in 1761 for Queen Charlotte. Queen Victoria, in 1837, was the first monarch to live here.',
     'The front facing the Mall, with its famous balcony, was refaced by Sir Aston Webb in 1913.']],
  ['trafalgar', 'Trafalgar Square', 51.50742, -0.12836, L, 420, 160, 'Trafalgar Square',
    ["It commemorates Admiral Nelson's victory at the Battle of Trafalgar in 1805. Nelson's Column, about 52 m tall, was finished in 1843.",
     "Sir Edwin Landseer's four bronze lions were added in 1867. The National Gallery lines the north side."]]
];
window.FP_LDNAREA = window.FP_PLACESET ? window.FP_PLACESET('ldn', SP, 'London') : [];
})();
