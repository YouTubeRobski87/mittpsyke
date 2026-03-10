export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43'),
	() => import('./nodes/44'),
	() => import('./nodes/45'),
	() => import('./nodes/46'),
	() => import('./nodes/47'),
	() => import('./nodes/48')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/4-7-8-andning-ovning": [3],
		"/ai-samtalsstod-online": [4],
		"/andningsovningar-mot-angest": [5],
		"/angest": [6],
		"/anonym-dagbok-online": [7],
		"/anonymt-samtalsstod-online": [8],
		"/ansvar": [9],
		"/avregistrera": [~10],
		"/chatta-anonymt-med-nagon": [12],
		"/chattstod-psykisk-ohalsa": [13],
		"/chat/[category]": [11],
		"/dagbok": [14],
		"/dashboard": [15],
		"/dashboard/installningar": [16],
		"/depression": [17],
		"/digital-dagbok-for-maende": [18],
		"/ensamhet": [19],
		"/exponering-ovningar-mot-angest": [20],
		"/framsteg": [~21],
		"/guider-seo": [24],
		"/guider-seo/[pillar]": [25],
		"/guider-seo/[pillar]/[guide]": [26],
		"/guider": [22],
		"/guider/[pillar]": [23],
		"/hjalp-mot-oro-online": [27],
		"/hjalp-vid-angest-online": [28],
		"/hjalp-vid-depression-online": [29],
		"/integritet": [30],
		"/login": [~31],
		"/nedstamdhet": [32],
		"/om-mittpsyke": [33],
		"/oro": [34],
		"/ovningar-mot-angest-online": [37],
		"/ovningar": [35],
		"/ovningar/[tool]": [36],
		"/panikattack": [38],
		"/portal/[slug]": [39],
		"/prata-anonymt-online": [40],
		"/psykiskt-stod-online": [41],
		"/register": [~42],
		"/samtalsstod-utan-vantetid": [43],
		"/samtalsstod-vid-trauma": [44],
		"/stod-vid-ptsd-online": [45],
		"/stod-vid-stress-online": [46],
		"/stress": [47],
		"/trauma": [48]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';