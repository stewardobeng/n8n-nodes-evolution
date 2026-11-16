// n8n loads nodes from the "n8n.nodes" paths in package.json. This entry point exists so that
// require('<package>') resolves too: without it n8n's loader silently skips the whole package.
module.exports = {
	Evolution: require('./dist/nodes/Evolution/Evolution.node.js').Evolution,
	EvolutionTrigger: require('./dist/nodes/Evolution/EvolutionTrigger.node.js').EvolutionTrigger,
	EvolutionApi: require('./dist/credentials/EvolutionApi.credentials.js').EvolutionApi,
};
