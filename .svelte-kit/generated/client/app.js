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
	() => import('./nodes/38')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/angest": [3],
		"/anonymt-samtalsstod-online": [4],
		"/ansvar": [5],
		"/avregistrera": [~6],
		"/chat/[category]": [7],
		"/dagbok": [8],
		"/dashboard": [9],
		"/dashboard/installningar": [10],
		"/depression": [11],
		"/digital-dagbok-for-maende": [12],
		"/ensamhet": [13],
		"/framsteg": [~14],
		"/guider-seo": [17],
		"/guider-seo/[pillar]": [18],
		"/guider-seo/[pillar]/[guide]": [19],
		"/guider": [15],
		"/guider/[pillar]": [16],
		"/hjalp-mot-oro-online": [20],
		"/hjalp-vid-angest-online": [21],
		"/hjalp-vid-depression-online": [22],
		"/integritet": [23],
		"/login": [~24],
		"/nedstamdhet": [25],
		"/om-mittpsyke": [26],
		"/oro": [27],
		"/ovningar": [28],
		"/ovningar/[tool]": [29],
		"/panikattack": [30],
		"/portal/[slug]": [31],
		"/prata-anonymt-online": [32],
		"/psykiskt-stod-online": [33],
		"/register": [~34],
		"/samtalsstod-vid-trauma": [35],
		"/stod-vid-stress-online": [36],
		"/stress": [37],
		"/trauma": [38]
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