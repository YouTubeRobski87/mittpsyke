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
	() => import('./nodes/29')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/angest": [3],
		"/ansvar": [4],
		"/avregistrera": [~5],
		"/chat/[category]": [6],
		"/dagbok": [7],
		"/dashboard": [8],
		"/dashboard/installningar": [9],
		"/depression": [10],
		"/ensamhet": [11],
		"/framsteg": [~12],
		"/guider-seo": [15],
		"/guider-seo/[pillar]": [16],
		"/guider-seo/[pillar]/[guide]": [17],
		"/guider": [13],
		"/guider/[pillar]": [14],
		"/integritet": [18],
		"/login": [~19],
		"/nedstamdhet": [20],
		"/om-mittpsyke": [21],
		"/oro": [22],
		"/ovningar": [23],
		"/ovningar/[tool]": [24],
		"/panikattack": [25],
		"/portal/[slug]": [26],
		"/register": [~27],
		"/stress": [28],
		"/trauma": [29]
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