import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import { nanoid } from "nanoid";
import { createWithEqualityFn } from "zustand/traditional";
import {
	isNodeWithDynamicHandles,
	isNodeOfType,
	hasTargets,
	type DynamicHandle,
	type FlowEdge,
	type FlowNode,
	type FlowNodeDataTypeMap,
	type NodeExecutionState,
} from "@/registry/blocks/flow-01/types/flow";
import { prepareWorkflow } from "@/registry/blocks/flow-01/lib/workflow";
import { PROMPT_CRAFTER_WORKFLOW } from "@/registry/blocks/flow-01/lib/examples";
import { createExecutionEngine } from "@/registry/blocks/flow-01/lib/execution/core-engine";
import { createNode } from "@/registry/blocks/flow-01/lib/node-factory";
import { nodeProcessors } from "../lib/node-processors";

export interface StoreState {
	nodes: FlowNode[];
	edges: FlowEdge[];
	onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
	onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
	onConnect: (connection: Connection) => void;
	getNodeById: (nodeId: string) => FlowNode;
	createNode: (
		nodeType: FlowNode["type"],
		position: { x: number; y: number },
	) => FlowNode;
	updateNode: <T extends FlowNode["type"]>(
		id: string,
		nodeType: T,
		data: Partial<FlowNodeDataTypeMap[T]>,
	) => void;
	updateNodeExecutionState: (
		nodeId: string,
		state: Partial<NodeExecutionState>,
	) => void;
	deleteNode: (id: string) => void;
	addDynamicHandle: <T extends FlowNode["type"]>(
		nodeId: string,
		nodeType: T,
		handleCategory: string,
		handle: Omit<DynamicHandle, "id">,
	) => string;
	removeDynamicHandle: <T extends FlowNode["type"]>(
		nodeId: string,
		nodeType: T,
		handleCategory: string,
		handleId: string,
	) => void;
	// execution
	startExecution: () => Promise<void>;
	getNodeTargetsData: (nodeId: string) => Record<string, string> | undefined;
}

const useStore = createWithEqualityFn<StoreState>((set, get) => ({
	...PROMPT_CRAFTER_WORKFLOW,
	onNodesChange: (changes) => {
		set({
			nodes: applyNodeChanges<FlowNode>(changes, get().nodes),
		});
	},
	onEdgesChange: (changes) => {
		set({
			edges: applyEdgeChanges(changes, get().edges),
		});
	},
	onConnect: (connection) => {
		const newEdge = addEdge(connection, get().edges);
		const sourceNode = get().getNodeById(connection.source);

		if (!connection.sourceHandle) {
			throw new Error("Source handle not found");
		}

		const sourceExecutionState = sourceNode.data.executionState;

		if (sourceExecutionState?.sources) {
			const sourceHandleData =
				sourceExecutionState.sources[connection.sourceHandle];
			const nodes = get().nodes.map((node) => {
				if (node.id === connection.target && connection.targetHandle) {
					return {
						...node,
						data: {
							...node.data,
							executionState: node.data.executionState
								? {
										...node.data.executionState,
										targets: {
											...node.data.executionState.targets,
											[connection.targetHandle]: sourceHandleData,
										},
									}
								: {
										status: "success",
										timestamp: new Date().toISOString(),
										targets: {
											[connection.targetHandle]: sourceHandleData,
										},
									},
						},
					};
				}
				return node;
			});

			set({
				nodes: nodes as FlowNode[],
			});
		}

		set({
			edges: newEdge,
		});
	},
	getNodeById: (nodeId) => {
		const node = get().nodes.find((n) => n.id === nodeId);
		if (!node) {
			throw new Error(`Node with id ${nodeId} not found`);
		}
		return node;
	},
	createNode(nodeType, position) {
		const newNode = createNode(nodeType, position);
		set((state) => ({
			nodes: [...state.nodes, newNode],
		}));
		return newNode;
	},
	updateNode(id, type, data) {
		set((state) => ({
			nodes: state.nodes.map((node) => {
				if (node.id === id && isNodeOfType(node, type)) {
					return {
						...node,
						data: {
							...node.data,
							...data,
						},
					};
				}
				return node;
			}),
		}));
	},
	updateNodeExecutionState: (nodeId, state) => {
		set((currentState) => ({
			nodes: currentState.nodes.map((n) => {
				if (n.id === nodeId) {
					return {
						...n,
						data: {
							...n.data,
							executionState: {
								...n.data.executionState,
								...state,
							},
						},
					} as FlowNode;
				}
				return n;
			}),
		}));
	},
	deleteNode(id) {
		set({
			nodes: get().nodes.filter((node) => node.id !== id),
			edges: get().edges.filter(
				(edge) => edge.source !== id && edge.target !== id,
			),
		});
	},
	addDynamicHandle(nodeId, type, handleCategory, handle) {
		const newId = nanoid();
		set({
			nodes: get().nodes.map((node) => {
				if (
					node.id === nodeId &&
					isNodeWithDynamicHandles(node) &&
					isNodeOfType(node, type)
				) {
					return {
						...node,
						data: {
							...node.data,
							config: {
								...node.data.config,
								dynamicHandles: {
									...node.data.dynamicHandles,
									[handleCategory]: [
										...node.data.dynamicHandles[
											handleCategory as keyof typeof node.data.dynamicHandles // Change to more specific type
										],
										{
											...handle,
											id: newId,
										},
									],
								},
							},
						},
					};
				}

				return node;
			}),
		});
		return newId;
	},
	removeDynamicHandle(nodeId, type, handleCategory, handleId) {
		set({
			nodes: get().nodes.map((node) => {
				if (
					node.id === nodeId &&
					isNodeWithDynamicHandles(node) &&
					isNodeOfType(node, type)
				) {
					const dynamicHandles = node.data.dynamicHandles;
					const handles = dynamicHandles[
						handleCategory as keyof typeof dynamicHandles
					] as DynamicHandle[]; // Remove with type guard or more specific type
					const newHandles = handles.filter((handle) => handle.id !== handleId);

					return {
						...node,
						data: {
							...node.data,
							config: {
								...node.data.config,
								dynamicHandles: {
									...node.data.dynamicHandles,
									[handleCategory]: newHandles,
								},
							},
						},
					};
				}
				return node;
			}),
			edges: get().edges.filter((edge) => {
				if (edge.source === nodeId && edge.sourceHandle === handleId) {
					return false;
				}
				if (edge.target === nodeId && edge.targetHandle === handleId) {
					return false;
				}
				return true;
			}),
		});
	},
	// Runtime

	getNodeTargetsData: (nodeId) => {
		const node = get().getNodeById(nodeId);
		if (!hasTargets(node)) {
			return undefined;
		}
		const edgesConnectedToNode = get().edges.filter(
			(edge) => edge.target === nodeId,
		);
		const targetsData: Record<string, string> = {};
		for (const edge of edgesConnectedToNode) {
			const sourceNode = get().getNodeById(edge.source);
			const sourceNodeExecutionState = sourceNode.data.executionState;
			if (!sourceNodeExecutionState?.sources) {
				throw new Error(
					`Execution state not found for source node with id ${edge.source}`,
				);
			}
			const sourceNodeResult =
				sourceNodeExecutionState.sources[edge.sourceHandle];
			targetsData[edge.targetHandle] = sourceNodeResult;
		}
		return targetsData;
	},
	async startExecution() {
		const { nodes, edges } = get();
		const workflow = prepareWorkflow(nodes, edges);

		if (workflow.errors.length > 0) {
			throw new Error(workflow.errors.map((error) => error.message).join("\n"));
		}

		// Reset execution state for all nodes
		set((state) => ({
			nodes: state.nodes.map((node) => ({
				...node,
				data: {
					...node.data,
					executionState: undefined,
				},
			})) as FlowNode[],
		}));

		const { getNodeTargetsData, updateNodeExecutionState, getNodeById } = get();

		const engine = createExecutionEngine({
			workflow,
			getNodeTargetsData,
			updateNodeExecutionState,
			getNodeById,
			processNode: async (nodeId, targetsData) => {
				const node = get().getNodeById(nodeId);
				const processor = nodeProcessors[node.type];
				return await processor(node, targetsData);
			},
		});

		await engine.execute(workflow.executionOrder);
	},
}));

export { useStore };
