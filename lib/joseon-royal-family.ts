/**
 * Joseon royal family — the Royal Family tree on /age-flow/royal-family.
 *
 * Most princes, princesses and consorts have no person record, so (like DYNASTIES in
 * lib/monarchs.ts) the family lives here and `slug` links those who do. The DB supplies
 * portraits for linked people. Source: English Wikipedia family sections of each monarch, checked
 * against the Korean pages' Hangul names and dates. Dates a year apart are left as they are, since
 * the sources mix lunar and solar years.
 *
 * Scope: named wives of consort rank or above, and named children, of each monarch and of
 * the non-reigning men on the line to a later monarch. Other princes' descendants, infants
 * recorded without a name, and low-ranking consorts without a recorded name are left out.
 * Parentage is biological, except the one adoption the line depends on (`adopted`).
 */

export type RoyalRole = 'king' | 'queen' | 'consort' | 'crown-prince' | 'prince' | 'princess';

export interface RoyalPerson {
  id: string;
  name: string;
  role: RoyalRole;
  birth: number | null;
  death: number | null;
  slug: string | null;
  /** Null for the founder and for wives */
  parentId: string | null;
  /** Set on a wife: the husband she stands beside */
  spouseOf: string | null;
  mother: string | null;
  adopted: boolean;
}

type Years = [number | null, number | null];

interface ChildSpec {
  name: string;
  role: RoyalRole;
  years: Years;
  /** Household key, when this child has a family of their own or a DB record */
  key?: string;
  slug?: string;
  adopted?: boolean;
}

interface WifeSpec {
  /** Null: children whose mother isn't shown */
  name: string | null;
  role?: RoyalRole;
  years?: Years;
  slug?: string;
  children: ChildSpec[];
}

const y = (birth?: number | null, death?: number | null): Years => [birth ?? null, death ?? null];

/** A monarch or other person with a DB record: key = slug */
const king = (slug: string, name: string, birth: number, death: number): ChildSpec => ({
  name, role: 'king', years: y(birth, death), key: slug, slug,
});
const linked = (slug: string, name: string, role: RoyalRole, birth?: number | null, death?: number | null): ChildSpec => ({
  name, role, years: y(birth, death), key: slug, slug,
});
const prince = (name: string, birth?: number | null, death?: number | null): ChildSpec => ({ name, role: 'prince', years: y(birth, death) });
const princess = (name: string, birth?: number | null, death?: number | null): ChildSpec => ({ name, role: 'princess', years: y(birth, death) });
const heir = (name: string, birth?: number | null, death?: number | null): ChildSpec => ({ name, role: 'crown-prince', years: y(birth, death) });

const queen = (name: string, birth: number | null, death: number | null, children: ChildSpec[] = [], slug?: string): WifeSpec => ({
  name, role: 'queen', years: y(birth, death), children, slug,
});
const consort = (name: string, birth: number | null, death: number | null, children: ChildSpec[] = [], slug?: string): WifeSpec => ({
  name, role: 'consort', years: y(birth, death), children, slug,
});
const others = (children: ChildSpec[]): WifeSpec => ({ name: null, children });

export const ROYAL_ROOT = 'taejo-yi-seong-gye';

const FOUNDER = king(ROYAL_ROOT, 'Taejo of Joseon', 1335, 1408);

/** Husband's key → wives, each with her children */
const HOUSEHOLDS: Record<string, WifeSpec[]> = {
  'taejo-yi-seong-gye': [
    queen('Queen Sinui', 1337, 1391, [
      prince('Grand Prince Jinan', 1354, 1394),
      king('jeongjong-yi-bang-gwa', 'Jeongjong of Joseon', 1357, 1419),
      prince('Grand Prince Ikan', 1360, 1404),
      prince('Grand Prince Hoean', 1364, 1421),
      king('taejong-yi-bang-won', 'Taejong of Joseon', 1367, 1422),
      prince('Grand Prince Deokan', null, 1388),
      princess('Princess Gyeongsin', null, 1426),
      princess('Princess Gyeongseon'),
    ]),
    queen('Queen Sindeok', 1356, 1396, [
      princess('Princess Gyeongsun', null, 1407),
      prince('Grand Prince Muan', 1381, 1398),
      prince('Grand Prince Uian', 1382, 1398),
    ]),
    consort('Consort Seong', null, 1450),
    others([princess('Princess Suksin', null, 1453), princess('Princess Uiryeong', null, 1466)]),
  ],
  'jeongjong-yi-bang-gwa': [
    queen('Queen Jeongan', 1355, 1412),
    consort('Consort Seong', null, null, [
      prince('Prince Deokcheon', 1397, 1465),
      prince('Prince Dopyeong', 1402),
    ]),
    others([
      prince('Prince Uipyeong', 1391, 1461),
      prince('Prince Sunpyeong', 1392, 1456),
      prince('Prince Seonseong', 1392, 1460),
      prince('Prince Jinnam', 1393, 1470),
      prince('Prince Jongui', 1393, 1451),
      prince('Prince Sudo', 1393, 1449),
      prince('Prince Imeon', 1399, 1450),
      prince('Prince Seokbo'),
      prince('Prince Imseong'),
      prince('Prince Geumpyeong', null, 1435),
      prince('Prince Jeongseok', 1409, 1464),
      prince('Prince Jangcheon', 1418, 1465),
      prince('Prince Murim', 1419, 1475),
      princess('Princess Hamyang'),
      princess('Princess Suksin'),
      princess('Princess Deokcheon'),
      princess('Princess Goseong'),
      princess('Princess Sangwon'),
      princess('Princess Jeonsan'),
      princess('Princess Incheon'),
      princess('Princess Haman'),
    ]),
  ],
  'taejong-yi-bang-won': [
    queen('Queen Wongyeong', 1365, 1420, [
      princess('Princess Jeongsun', 1385, 1460),
      princess('Princess Gyeongjeong', 1387, 1455),
      princess('Princess Gyeongan', 1393, 1415),
      prince('Grand Prince Yangnyeong', 1394, 1462),
      prince('Grand Prince Hyoryeong', 1396, 1486),
      king('sejong-daewang', 'Sejong the Great', 1397, 1450),
      princess('Princess Jeongseon', 1404, 1424),
      prince('Grand Prince Seongnyeong', 1405, 1418),
    ]),
    consort('Consort Myeong', null, 1479),
    consort('Consort Ui', 1384, 1468, [princess('Princess Jeonghye', null, 1424)]),
    consort('Consort Hyo', null, 1454, [prince('Prince Gyeongnyeong', 1396, 1458)]),
    consort('Consort Sin', 1377, 1435, [
      prince('Prince Hamnyeong', 1403, 1467),
      princess('Princess Jeongsin', 1404, 1452),
      prince('Prince Onnyeong', 1407, 1454),
      princess('Princess Jeongjeong', 1410, 1456),
      princess('Princess Sukjeong'),
      princess('Princess Suknyeong'),
      princess('Princess Sosin', 1415, 1437),
      princess('Princess Sosuk', null, 1456),
      princess('Princess Sukgyeong', 1420, 1494),
    ]),
    consort('Consort Seon', null, 1468, [
      prince('Prince Hyeryeong', 1407, 1440),
      princess('Princess Gyeongsin'),
      princess('Princess Sukan', null, 1464),
      prince('Prince Ingnyeong', 1422, 1464),
    ]),
    consort('Consort So', null, 1479, [princess('Princess Sukhye', 1413, 1464)]),
    consort('Consort Jeong', null, 1426, [prince('Prince Geunnyeong', 1411, 1461)]),
    others([
      prince('Prince Huiryeong', 1412, 1465),
      prince('Prince Huryeong', 1419, 1450),
      princess('Princess Sukgeun', null, 1450),
      princess('Princess Suksun', null, 1481),
    ]),
  ],
  'sejong-daewang': [
    queen('Queen Soheon', 1395, 1446, [
      princess('Princess Jeongso', 1412, 1424),
      king('munjong-yi-hyang', 'Munjong of Joseon', 1414, 1452),
      princess('Princess Jeongui', 1414, 1477),
      king('sejo-yi-yu', 'Sejo of Joseon', 1417, 1468),
      linked('grand-prince-anpyeong', 'Grand Prince Anpyeong', 'prince', 1418, 1453),
      prince('Grand Prince Imyeong', 1420, 1469),
      prince('Grand Prince Gwangpyeong', 1425, 1444),
      prince('Grand Prince Geumseong', 1426, 1457),
      prince('Grand Prince Pyeongwon', 1427, 1445),
      prince('Grand Prince Yeongeung', 1434, 1467),
    ]),
    consort('Consort Sin', 1406, 1464, [
      prince('Prince Gyeyang', 1427, 1464),
      prince('Prince Uichang', 1428, 1460),
      prince('Prince Milseong', 1430, 1479),
      prince('Prince Ikhyeon', 1431, 1463),
      prince('Prince Yeonghae', 1435, 1477),
      prince('Prince Damyang', 1439, 1450),
    ]),
    consort('Consort Hye', null, 1455, [
      prince('Prince Hannam', 1429, 1459),
      prince('Prince Suchun', 1431, 1455),
      prince('Prince Yeongpung', 1434, 1456),
    ]),
    consort('Consort Yeong', null, 1483, [prince('Prince Hwaui', 1425)]),
    others([princess('Princess Jeongan', 1441, 1461), princess('Princess Jeonghyeon', 1425, 1480)]),
  ],
  'munjong-yi-hyang': [
    queen('Queen Hyeondeok', 1418, 1441, [
      princess('Princess Gyeonghye', 1435, 1474),
      king('danjong-yi-hong-wi', 'Danjong of Joseon', 1441, 1457),
    ]),
    consort('Consort Suk', null, null),
    others([princess('Princess Gyeongsuk', 1439)]),
  ],
  'danjong-yi-hong-wi': [queen('Queen Jeongsun', 1440, 1521)],
  'sejo-yi-yu': [
    queen('Queen Jeonghui', 1418, 1483, [
      linked('crown-prince-uigyeong', 'Crown Prince Uigyeong', 'crown-prince', 1438, 1457),
      princess('Princess Uisuk', 1441, 1478),
      king('yejong-yi-hwang', 'Yejong of Joseon', 1450, 1470),
    ]),
    consort('Consort Geun', 1425, null, [
      prince('Prince Deokwon', 1449, 1498),
      prince('Prince Changwon', 1458, 1484),
    ]),
  ],
  'crown-prince-uigyeong': [
    queen('Queen Sohye', 1437, 1504, [
      prince('Grand Prince Wolsan', 1455, 1489),
      princess('Princess Myeongsuk', 1456, 1482),
      king('seongjong-yi-hyeol', 'Seongjong of Joseon', 1457, 1495),
    ]),
  ],
  'yejong-yi-hwang': [
    queen('Queen Jangsun', 1445, 1462, [prince('Grand Prince Inseong', 1461, 1463)]),
    queen('Queen Ansun', 1445, 1499, [
      princess('Princess Hyeonsuk', 1464, 1502),
      prince('Grand Prince Jean', 1466, 1526),
      princess('Princess Hyesun', 1468, 1469),
    ]),
    consort('Consort Gong', null, null),
  ],
  'seongjong-yi-hyeol': [
    queen('Queen Gonghye', 1456, 1474),
    queen('Deposed Queen Yun', 1455, 1482, [king('yeonsangun-yi-yung', 'Yeonsangun of Joseon', 1476, 1506)]),
    queen('Queen Jeonghyeon', 1462, 1530, [
      princess('Princess Sunsuk', 1478, 1488),
      king('jungjong-yi-yeok', 'Jungjong of Joseon', 1488, 1544),
    ]),
    consort('Consort Myeong', null, null, [
      princess('Princess Hwisuk'),
      princess('Princess Gyeongsuk', 1483),
      prince('Prince Musan', 1490, 1525),
      princess('Princess Hwijeong'),
    ]),
    others([
      princess('Princess Hyesuk', 1478),
      princess('Princess Suksin', 1478, 1487),
      prince('Prince Gyeseong', 1480, 1504),
      prince('Prince Anyang', 1480, 1505),
      prince('Prince Wanwon', 1481, 1509),
      princess('Princess Gongsin', 1481, 1549),
      prince('Prince Hoesan', 1482, 1512),
      prince('Prince Bongan', 1482, 1505),
      prince('Prince Gyeonseong', 1482, 1507),
      princess('Princess Gyeongsun', 1482),
      princess('Princess Sukhye', 1486, 1525),
      princess('Princess Jeongsun', 1486),
      princess('Princess Gyeonghwi', null, 1525),
      prince('Prince Ikyang', 1488, 1552),
      prince('Prince Iseong', 1489, 1553),
      prince('Prince Gyeongmyeong', 1489, 1526),
      prince('Prince Jeonseong', 1490, 1505),
      princess('Princess Jeonghye', 1490, 1507),
      prince('Prince Yeongsan', 1490, 1538),
      prince('Prince Uncheon', 1491, 1524),
      prince('Prince Yangwon', 1491, 1551),
      princess('Princess Jeongsuk', 1493, 1573),
    ]),
  ],
  'yeonsangun-yi-yung': [
    queen('Deposed Queen Sin', 1476, 1537, [
      princess('Princess Hwisin', 1491, 1524),
      heir('Deposed Crown Prince Hwang', 1498, 1506),
      prince('Grand Prince Changnyeong', 1500, 1506),
    ]),
    others([prince('Prince Yangpyeong', 1498, 1506)]),
  ],
  'jungjong-yi-yeok': [
    queen('Queen Dangyeong', 1487, 1558),
    queen('Queen Janggyeong', 1491, 1515, [
      princess('Princess Hyohye', 1511, 1531),
      king('injong-yi-ho', 'Injong of Joseon', 1515, 1545),
    ]),
    queen('Queen Munjeong', 1501, 1565, [
      princess('Princess Uihye', 1521, 1564),
      princess('Princess Hyosun', 1522, 1538),
      princess('Princess Gyeonghyeon', 1530, 1584),
      king('myeongjong-yi-hwan', 'Myeongjong of Joseon', 1534, 1567),
      princess('Princess Insun', 1542, 1545),
    ]),
    consort('Consort Gyeong', 1492, 1533, [
      prince('Prince Bokseong', 1509, 1533),
      princess('Princess Hyesun', 1512, 1584),
      princess('Princess Hyejeong', 1514, 1580),
    ]),
    consort('Consort Hui', 1494, 1581, [
      prince('Prince Geumwon', 1513, 1562),
      prince('Prince Bongseong', 1528, 1547),
    ]),
    consort('Consort Chang', 1499, 1549, [
      prince('Prince Yeongyang', 1521, 1561),
      princess('Princess Jeongsin', 1526, 1552),
      linked('deokheung-daewongun', 'Grand Internal Prince Deokheung', 'prince', 1530, 1559),
    ]),
    others([
      prince('Prince Haean', 1511, 1573),
      princess('Princess Jeongsun', 1518, 1581),
      princess('Princess Hyojeong', 1520, 1544),
      prince('Prince Deokyang', 1524, 1581),
      princess('Princess Sukjeong', 1525, 1564),
    ]),
  ],
  'injong-yi-ho': [queen('Queen Inseong', 1514, 1578), consort('Consort Suk', null, null), consort('Consort Hye', null, null)],
  'myeongjong-yi-hwan': [
    queen('Queen Insun', 1532, 1575, [heir('Crown Prince Sunhoe', 1551, 1563)]),
    consort('Consort Gyeong', 1541, 1595),
    consort('Consort Sun', null, 1593),
  ],
  'deokheung-daewongun': [
    consort('Grand Internal Princess Consort Hadong', 1530, 1567, [king('seonjo-yi-yeon', 'Seonjo of Joseon', 1552, 1608)]),
  ],
  'seonjo-yi-yeon': [
    queen('Queen Uiin', 1555, 1600),
    queen('Queen Inmok', 1584, 1632, [
      princess('Princess Jeongmyeong', 1603, 1685),
      prince('Grand Prince Yeongchang', 1606, 1614),
    ]),
    consort('Consort Gong', 1553, 1577, [
      prince('Prince Imhae', 1572, 1609),
      king('gwanghaegun-yi-hon', 'Gwanghaegun of Joseon', 1575, 1641),
    ]),
    consort('Consort In', 1555, 1613, [
      prince('Prince Uian', 1577, 1588),
      prince('Prince Sinseong', 1579, 1592),
      linked('prince-jeongwon', 'Prince Jeongwon', 'prince', 1580, 1620),
      princess('Princess Jeongsin', 1582, 1653),
      princess('Princess Jeonghye', 1584, 1638),
      princess('Princess Jeongsuk', 1587, 1627),
      prince('Prince Uichang', 1589, 1645),
      princess('Princess Jeongan', 1590, 1660),
      princess('Princess Jeonghwi', 1593, 1653),
    ]),
    consort('Consort Sun', null, 1647, [prince('Prince Sunhwa', 1580, 1607)]),
    consort('Consort Jeong', 1567, 1626, [
      prince('Prince Inseong', 1588, 1628),
      princess('Princess Jeongin', 1590, 1656),
      princess('Princess Jeongseon', 1594, 1614),
      princess('Princess Jeonggeun', 1599, 1613),
      prince('Prince Inheung', 1604, 1652),
    ]),
    consort('Consort Jeong (Sukui)', 1563, 1638, [
      princess('Princess Jeongjeong', 1595, 1666),
      prince('Prince Gyeongchang', 1596, 1644),
    ]),
    consort('Consort On', 1581, 1664, [
      prince('Prince Heungan', 1598, 1624),
      prince('Prince Gyeongpyeong', 1600, 1674),
      princess('Princess Jeonghwa', 1604, 1667),
      prince('Prince Yeongseong', 1607, 1649),
    ]),
  ],
  'gwanghaegun-yi-hon': [
    queen('Deposed Queen Yu', 1576, 1623, [heir('Deposed Crown Prince Yi Ji', 1598, 1623)]),
    consort('Consort Su', 1595, null),
  ],
  'prince-jeongwon': [
    queen('Queen Inheon', 1578, 1626, [
      king('injo-yi-jong', 'Injo of Joseon', 1595, 1649),
      prince('Grand Prince Neungwon', 1598, 1656),
      prince('Grand Prince Neungchang', 1599, 1615),
    ]),
    others([prince('Prince Neungpung', 1596, 1604)]),
  ],
  'injo-yi-jong': [
    queen('Queen Inyeol', 1594, 1636, [
      heir('Crown Prince Sohyeon', 1612, 1645),
      king('hyojong-yi-ho', 'Hyojong of Joseon', 1619, 1659),
      prince('Grand Prince Inpyeong', 1623, 1658),
      prince('Grand Prince Yongseong', 1624, 1629),
    ]),
    queen('Queen Jangnyeol', 1624, 1688),
    others([
      princess('Princess Hyomyeong', 1638, 1700),
      prince('Prince Sungseon', 1639, 1690),
      prince('Prince Nakseon', 1641, 1695),
    ]),
  ],
  'hyojong-yi-ho': [
    queen('Queen Inseon', 1619, 1674, [
      princess('Princess Suksin', 1634, 1645),
      princess('Princess Sukan', 1636, 1698),
      princess('Princess Sukmyeong', 1640, 1699),
      king('hyeonjong-yi-yeon', 'Hyeonjong of Joseon', 1641, 1674),
      princess('Princess Sukhwi', 1642, 1696),
      princess('Princess Sukjeong', 1646, 1668),
      princess('Princess Sukgyeong', 1648, 1671),
    ]),
    consort('Consort An', 1622, 1693, [princess('Princess Suknyeong', 1649, 1668)]),
  ],
  'hyeonjong-yi-yeon': [
    queen('Queen Myeongseong', 1642, 1684, [
      princess('Princess Myeongseon', 1659, 1673),
      king('sukjong-yi-sun', 'Sukjong of Joseon', 1661, 1720),
      princess('Princess Myeonghye', 1663, 1673),
      princess('Princess Myeongan', 1665, 1687),
    ]),
  ],
  'sukjong-yi-sun': [
    queen('Queen Ingyeong', 1661, 1680),
    queen('Queen Inhyeon', 1667, 1701, [], 'queen-inhyeon'),
    queen('Queen Inwon', 1687, 1757),
    consort('Jang Hui-bin', 1659, 1701, [king('gyeongjong-yi-yun', 'Gyeongjong of Joseon', 1688, 1724)], 'jang-hui-bin'),
    consort('Consort Suk', 1670, 1718, [king('yeongjo-yi-geum', 'Yeongjo of Joseon', 1694, 1776)]),
    consort('Consort Myeong', null, 1703, [prince('Prince Yeollyeong', 1699, 1719)]),
    consort('Consort Yeong', 1669, 1735),
  ],
  'gyeongjong-yi-yun': [queen('Queen Danui', 1686, 1718), queen('Queen Seonui', 1705, 1730)],
  'yeongjo-yi-geum': [
    queen('Queen Jeongseong', 1693, 1757),
    queen('Queen Jeongsun', 1745, 1805),
    consort('Consort Jeong', 1694, 1721, [
      princess('Princess Hwaeok', 1717, 1718),
      heir('Crown Prince Hyojang', 1719, 1728),
      princess('Princess Hwasun', 1720, 1758),
    ]),
    consort('Consort Yeong', 1696, 1764, [
      princess('Princess Hwapyeong', 1727, 1748),
      princess('Princess Hwahyeop', 1733, 1753),
      linked('crown-prince-sado', 'Crown Prince Sado', 'crown-prince', 1735, 1762),
      princess('Princess Hwawan', 1738, 1808),
    ]),
    others([
      princess('Princess Hwayu', 1740, 1777),
      princess('Princess Hwaryeong', 1753, 1821),
      princess('Princess Hwagil', 1754, 1773),
    ]),
  ],
  'crown-prince-sado': [
    queen('Lady Hyegyeong (Queen Heongyeong)', 1735, 1816, [
      heir('Crown Prince Uiso', 1750, 1752),
      king('jeongjo-yi-san', 'Jeongjo of Joseon', 1752, 1800),
      princess('Princess Cheongyeon', 1754, 1821),
      princess('Princess Cheongseon', 1756, 1802),
    ]),
    consort('Consort Suk', null, 1773, [
      linked('prince-euneon', 'Prince Euneon', 'prince', 1754, 1801),
      { ...prince('Prince Eunsin', 1755, 1771), key: 'prince-eunsin' },
    ]),
    others([princess('Princess Cheonggeun', 1758, 1835), prince('Prince Eunjeon', 1759, 1777)]),
  ],
  'prince-eunsin': [
    others([{ ...prince('Prince Namyeon', 1788, 1836), key: 'prince-namyeon', adopted: true }]),
  ],
  'prince-namyeon': [
    others([linked('heungseon-daewongun', 'Heungseon Daewongun', 'prince', 1820, 1898)]),
  ],
  'heungseon-daewongun': [
    consort('Grand Internal Princess Consort Sunmok', 1818, 1898, [
      prince('Prince Heungchin', 1845, 1912),
      king('gojong-yi-myeong-bok', 'Gojong of Korea', 1852, 1919),
    ]),
    others([prince('Prince Waneun', 1842, 1881)]),
  ],
  'gojong-yi-myeong-bok': [
    queen('Empress Myeongseong', 1851, 1895, [king('sunjong-yi-cheok', 'Sunjong of Korea', 1874, 1926)], 'empress-myeongseong'),
    consort('Consort Sunheon', 1854, 1911, [heir('Crown Prince Uimin', 1897, 1970)]),
    consort('Lady Yeongbodang', 1843, 1928, [prince('Prince Wan', 1868, 1880)]),
    consort('Lady Boknyeongdang', 1882, 1929, [linked('princess-deokhye', 'Princess Deokhye', 'princess', 1912, 1989)]),
    others([prince('Prince Ui', 1877, 1955)]),
  ],
  'sunjong-yi-cheok': [queen('Empress Sunmyeonghyo', 1872, 1904), queen('Empress Sunjeonghyo', 1894, 1966)],
  'prince-euneon': [
    consort('Princess Consort Sangsan', 1753, 1801, [
      prince('Prince Sanggye', 1769, 1786),
      prince('Prince Punggye', 1783, 1826),
    ]),
    consort('Princess Consort Jeonsan', 1764, 1819, [linked('jeongye-daewongun', 'Grand Internal Prince Jeongye', 'prince', 1785, 1841)]),
  ],
  'jeongye-daewongun': [
    consort('Grand Internal Princess Consort Wanyang', 1804, 1840, [prince('Prince Hoepyeong', 1827, 1844)]),
    consort('Grand Internal Princess Consort Yongseong', 1793, 1834, [king('cheoljong-yi-byeon', 'Cheoljong of Joseon', 1831, 1864)]),
    others([prince('Prince Yeongpyeong', 1828, 1902)]),
  ],
  'cheoljong-yi-byeon': [
    queen('Queen Cheorin', 1837, 1878, [prince('Prince Yi Yung-jun', 1858, 1859)]),
    others([princess('Princess Yeonghye', 1858, 1872)]),
  ],
  'jeongjo-yi-san': [
    queen('Queen Hyoui', 1753, 1821),
    consort('Consort Su', 1770, 1823, [
      king('sunjo-yi-gong', 'Sunjo of Joseon', 1790, 1834),
      princess('Princess Sukseon', 1793, 1836),
    ]),
    consort('Consort Ui', 1753, 1786, [heir('Crown Prince Munhyo', 1782, 1786)]),
    consort('Consort Won', 1766, 1779),
    consort('Consort Hwa', 1765, 1824),
  ],
  'sunjo-yi-gong': [
    queen('Queen Sunwon', 1789, 1857, [
      linked('crown-prince-hyomyeong', 'Crown Prince Hyomyeong', 'crown-prince', 1809, 1830),
      princess('Princess Myeongon', 1810, 1832),
      princess('Princess Bokon', 1818, 1832),
      princess('Princess Deokon', 1822, 1844),
    ]),
    others([princess('Princess Yeongon', 1817, 1829)]),
  ],
  'crown-prince-hyomyeong': [queen('Queen Sinjeong', 1809, 1890, [king('heonjong-yi-hwan', 'Heonjong of Joseon', 1827, 1849)])],
  'heonjong-yi-hwan': [
    queen('Queen Hyohyeon', 1828, 1843),
    queen('Queen Hyojeong', 1831, 1904),
    consort('Consort Gyeong', 1832, 1907),
    consort('Consort Jeong', 1833, null),
  ],
};

/** People with a person record who aren't marked in HOUSEHOLDS: "husband or parent|name" → slug */
const PERSON_SLUGS: Record<string, string> = {
  'taejo-yi-seong-gye|Queen Sinui': 'queen-sinui',
  'taejo-yi-seong-gye|Queen Sindeok': 'queen-sindeok',
  'taejo-yi-seong-gye|Grand Prince Hoean': 'grand-prince-hoean',
  'taejo-yi-seong-gye|Grand Prince Uian': 'grand-prince-uian',
  'taejong-yi-bang-won|Queen Wongyeong': 'queen-wongyeong',
  'taejong-yi-bang-won|Grand Prince Yangnyeong': 'grand-prince-yangnyeong',
  'taejong-yi-bang-won|Grand Prince Hyoryeong': 'grand-prince-hyoryeong',
  'sejong-daewang|Queen Soheon': 'queen-soheon',
  'sejong-daewang|Princess Jeongui': 'princess-jeongui',
  'sejong-daewang|Grand Prince Imyeong': 'grand-prince-imyeong',
  'sejong-daewang|Grand Prince Geumseong': 'grand-prince-geumseong',
  'munjong-yi-hyang|Queen Hyeondeok': 'queen-hyeondeok',
  'munjong-yi-hyang|Princess Gyeonghye': 'princess-gyeonghye',
  'danjong-yi-hong-wi|Queen Jeongsun': 'queen-jeongsun-danjong',
  'sejo-yi-yu|Queen Jeonghui': 'queen-jeonghui',
  'crown-prince-uigyeong|Queen Sohye': 'queen-sohye',
  'crown-prince-uigyeong|Grand Prince Wolsan': 'grand-prince-wolsan',
  'yejong-yi-hwang|Grand Prince Jean': 'grand-prince-jean',
  'seongjong-yi-hyeol|Deposed Queen Yun': 'deposed-queen-yun',
  'seongjong-yi-hyeol|Queen Jeonghyeon': 'queen-jeonghyeon',
  'yeonsangun-yi-yung|Deposed Queen Sin': 'deposed-queen-sin',
  'jungjong-yi-yeok|Queen Dangyeong': 'queen-dangyeong',
  'jungjong-yi-yeok|Queen Janggyeong': 'queen-janggyeong',
  'jungjong-yi-yeok|Queen Munjeong': 'queen-munjeong',
  'jungjong-yi-yeok|Consort Gyeong': 'park-gyeong-bin',
  'jungjong-yi-yeok|Prince Bokseong': 'prince-bokseong',
  'myeongjong-yi-hwan|Crown Prince Sunhoe': 'crown-prince-sunhoe',
  'myeongjong-yi-hwan|Queen Insun': 'queen-insun',
  'seonjo-yi-yeon|Queen Uiin': 'queen-uiin',
  'seonjo-yi-yeon|Queen Inmok': 'queen-inmok',
  'seonjo-yi-yeon|Consort Gong': 'kim-gong-bin',
  'seonjo-yi-yeon|Consort In': 'kim-in-bin',
  'seonjo-yi-yeon|Prince Imhae': 'prince-imhae',
  'seonjo-yi-yeon|Prince Sunhwa': 'prince-sunhwa',
  'seonjo-yi-yeon|Grand Prince Yeongchang': 'grand-prince-yeongchang',
  'seonjo-yi-yeon|Princess Jeongmyeong': 'princess-jeongmyeong',
  'gwanghaegun-yi-hon|Deposed Queen Yu': 'deposed-queen-yu',
  'gwanghaegun-yi-hon|Deposed Crown Prince Yi Ji': 'deposed-crown-prince-yi-ji',
  'prince-jeongwon|Queen Inheon': 'queen-inheon',
  'prince-jeongwon|Grand Prince Neungchang': 'grand-prince-neungchang',
  'injo-yi-jong|Queen Inyeol': 'queen-inyeol',
  'injo-yi-jong|Queen Jangnyeol': 'queen-jangnyeol',
  'injo-yi-jong|Crown Prince Sohyeon': 'crown-prince-sohyeon',
  'injo-yi-jong|Grand Prince Inpyeong': 'grand-prince-inpyeong',
  'hyojong-yi-ho|Queen Inseon': 'queen-inseon',
  'hyeonjong-yi-yeon|Queen Myeongseong': 'queen-myeongseong',
  'sukjong-yi-sun|Queen Ingyeong': 'queen-ingyeong',
  'sukjong-yi-sun|Queen Inwon': 'queen-inwon',
  'sukjong-yi-sun|Consort Suk': 'choe-suk-bin',
  'sukjong-yi-sun|Prince Yeollyeong': 'prince-yeollyeong',
  'yeongjo-yi-geum|Queen Jeongseong': 'queen-jeongseong',
  'yeongjo-yi-geum|Queen Jeongsun': 'queen-jeongsun-yeongjo',
  'yeongjo-yi-geum|Consort Yeong': 'yi-yeong-bin',
  'yeongjo-yi-geum|Crown Prince Hyojang': 'crown-prince-hyojang',
  'yeongjo-yi-geum|Princess Hwapyeong': 'princess-hwapyeong',
  'yeongjo-yi-geum|Princess Hwawan': 'princess-hwawan',
  'crown-prince-sado|Lady Hyegyeong (Queen Heongyeong)': 'lady-hyegyeong',
  'jeongjo-yi-san|Queen Hyoui': 'queen-hyoui',
  'jeongjo-yi-san|Consort Ui': 'seong-ui-bin',
  'jeongjo-yi-san|Consort Su': 'park-su-bin',
  'jeongjo-yi-san|Crown Prince Munhyo': 'crown-prince-munhyo',
  'sunjo-yi-gong|Queen Sunwon': 'queen-sunwon',
  'sunjo-yi-gong|Princess Deokon': 'princess-deokon',
  'crown-prince-hyomyeong|Queen Sinjeong': 'queen-sinjeong',
  'heonjong-yi-hwan|Queen Hyojeong': 'queen-hyojeong',
  'cheoljong-yi-byeon|Queen Cheorin': 'queen-cheorin',
  'prince-eunsin|Prince Namyeon': 'prince-namyeon',
  'heungseon-daewongun|Grand Internal Princess Consort Sunmok': 'princess-consort-sunmok',
  'heungseon-daewongun|Prince Waneun': 'prince-waneun',
  'heungseon-daewongun|Prince Heungchin': 'prince-heungchin',
};

/** Flatten HOUSEHOLDS into people. Children are ordered by birth year (unknown last, in source order). */
function flatten(): RoyalPerson[] {
  const people: RoyalPerson[] = [];
  const add = (spec: ChildSpec, id: string, parentId: string | null, mother: string | null) => {
    people.push({
      id,
      name: spec.name,
      role: spec.role,
      birth: spec.years[0],
      death: spec.years[1],
      slug: spec.slug ?? PERSON_SLUGS[`${parentId}|${spec.name}`] ?? null,
      parentId,
      spouseOf: null,
      mother,
      adopted: spec.adopted ?? false,
    });

    const wives = HOUSEHOLDS[id] ?? [];
    wives.forEach((wife, i) => {
      if (!wife.name) return;
      people.push({
        id: wife.slug ?? `${id}--wife-${i}`,
        name: wife.name,
        role: wife.role ?? 'consort',
        birth: wife.years?.[0] ?? null,
        death: wife.years?.[1] ?? null,
        slug: wife.slug ?? PERSON_SLUGS[`${id}|${wife.name}`] ?? null,
        parentId: null,
        spouseOf: id,
        mother: null,
        adopted: false,
      });
    });

    const children = wives
      .flatMap((wife) => wife.children.map((child) => ({ child, mother: wife.name })))
      .map((entry, i) => ({ ...entry, i }))
      .sort((a, b) => (a.child.years[0] ?? Infinity) - (b.child.years[0] ?? Infinity) || a.i - b.i);
    children.forEach(({ child, mother: mom, i }) => add(child, child.key ?? `${id}--${i}`, id, mom));
  };
  add(FOUNDER, ROYAL_ROOT, null, null);
  return people;
}

export const ROYAL_FAMILY: RoyalPerson[] = flatten();
