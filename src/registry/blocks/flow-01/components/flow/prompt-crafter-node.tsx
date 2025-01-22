import { BaseNode } from "@/components/flow/base-node";
import { LabeledHandle } from "@/components/flow/labeled-handle";
import {
	NodeHeaderAction,
	NodeHeaderIcon,
	NodeHeaderTitle,
} from "@/components/flow/node-header";
import { NodeHeader, NodeHeaderActions } from "@/components/flow/node-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EditableLabeledHandle } from "@/registry/blocks/flow-01/components/flow/editable-labeled-handle";
import {
	type TPromptCrafterNode,
	useStore,
} from "@/registry/blocks/flow-01/hooks/store";
import { StreamLanguage } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";
import CodeMirror from "@uiw/react-codemirror";
import {
	type NodeProps,
	Position,
	useUpdateNodeInternals,
} from "@xyflow/react";
import { BetweenVerticalEnd, PencilRuler, Plus, Trash } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Custom theme that matches your app's design
const promptTheme = createTheme({
	theme: "dark",
	settings: {
		background: "transparent",
		foreground: "hsl(var(--foreground))",
		caret: "black",
		selection: "#3B82F6",
		//selectionMatch: "#3B82F6",
		lineHighlight: "transparent",
	},
	styles: [
		{ tag: t.variableName, color: "#10c43d" },
		{ tag: t.string, color: "hsl(var(--foreground))" },
		{ tag: t.invalid, color: "#DC2626" },
	],
});

// Create a function to generate the language with the current inputs
const createPromptLanguage = (validInputs: string[] = []) =>
	StreamLanguage.define({
		token(stream) {
			if (stream.match(/{[^}]*}/)) {
				const match = stream.current();
				const inputName = match.slice(1, -1);
				// Check if the input name is valid
				if (validInputs.includes(inputName)) {
					return "variableName";
				}
				return "invalid";
			}
			stream.next();
			return null;
		},
	});

export function PromptCrafterNode({
	id,
	selected,
	deletable,
	data,
}: NodeProps<TPromptCrafterNode>) {
	const updateNode = useStore((state) => state.updateNode);
	const runtime = useStore((state) => state.runtime);
	const isProcessing = runtime.isRunning && runtime.currentNodeIds.includes(id);
	const updateNodeInternals = useUpdateNodeInternals();
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const editorViewRef = useRef<EditorView>();

	const handlePromptTextChange = useCallback(
		(value: string) => {
			updateNode(id, { text: value });
		},
		[id, updateNode],
	);

	const insertInputAtCursor = useCallback((inputName: string) => {
		const view = editorViewRef.current;
		if (!view) {
			return;
		}

		const inputTag = `{${inputName}}`;
		const from = view.state.selection.main.from;
		view.dispatch({
			changes: { from, insert: inputTag },
			selection: { anchor: from + inputTag.length },
		});
		setIsPopoverOpen(false);
	}, []);

	const addInput = useCallback(() => {
		useStore.getState().addDynamicInput(id);
		updateNodeInternals(id);
	}, [id, updateNodeInternals]);

	const removeInput = useCallback(
		(handleId: string) => {
			useStore.getState().removeDynamicInput(id, handleId);
			updateNodeInternals(id);
		},
		[id, updateNodeInternals],
	);

	const updateInputName = useCallback(
		(handleId: string, newLabel: string): boolean => {
			if (!newLabel) {
				toast.error("Input name cannot be empty");
				return false;
			}

			const existingInput = data.inputs?.find(
				(input) => input.label === newLabel,
			);
			if (existingInput && existingInput.id !== handleId) {
				toast.error("Input name already exists");
				return false;
			}

			const oldInput = data.inputs?.find((input) => input.id === handleId);
			if (!oldInput) {
				return false;
			}

			updateNode(id, {
				inputs: (data.inputs || []).map((input) =>
					input.id === handleId ? { ...input, label: newLabel } : input,
				),
				// Also update references in the text
				text: (data.text || "").replace(
					new RegExp(`{${oldInput.label}}`, "g"),
					`{${newLabel}}`,
				),
			});
			updateNodeInternals(id);
			return true;
		},
		[id, data.inputs, data.text, updateNode, updateNodeInternals],
	);

	// Create language with current inputs
	const extensions = useMemo(() => {
		const validLabels = (data.inputs || []).map((input) => input.label);
		return [createPromptLanguage(validLabels)];
	}, [data.inputs]);

	const executionStatus = data.lastRun?.status || "idle";
	const statusColors = {
		idle: "bg-muted text-muted-foreground",
		processing: "bg-orange-500 text-white",
		success: "bg-green-500 text-white",
		error: "bg-red-500 text-white",
	} as const;

	return (
		<BaseNode
			selected={selected}
			isProcessing={isProcessing}
			className="px-0 pb-0 flex flex-col w-[350px]"
		>
			<NodeHeader className="px-8 mb-0">
				<NodeHeaderIcon>
					<PencilRuler />
				</NodeHeaderIcon>
				<NodeHeaderTitle>Prompt Crafter</NodeHeaderTitle>
				<NodeHeaderActions>
					<Badge
						variant="secondary"
						className={cn("mr-2 font-normal", statusColors[executionStatus])}
					>
						{executionStatus}
					</Badge>
					{deletable && <NodeHeaderDeleteAction id={id} />}
				</NodeHeaderActions>
			</NodeHeader>
			<Separator />
			<div className="p-2">
				<div className="flex items-center gap-2 mb-1">
					<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm" className="h-7 px-2">
								<BetweenVerticalEnd className="h-4 w-4 mr-1" />
								Insert Input into Prompt
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-0" align="start">
							<Command>
								<CommandInput placeholder="Search inputs..." />
								<CommandList>
									<CommandEmpty>No inputs found.</CommandEmpty>
									<CommandGroup>
										{data.inputs?.map(
											(input) =>
												input.label && (
													<CommandItem
														key={input.id}
														onSelect={() => insertInputAtCursor(input.label)}
														className="text-base"
													>
														{input.label}
													</CommandItem>
												),
										)}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<CodeMirror
					value={data.text || ""}
					height="150px"
					theme={promptTheme}
					extensions={extensions}
					onChange={handlePromptTextChange}
					onCreateEditor={(view) => {
						editorViewRef.current = view;
					}}
					className="nodrag border rounded-md overflow-hidden [&_.cm-content]:!cursor-text [&_.cm-line]:!cursor-text"
					placeholder="Craft your prompt here... Use {input-name} to reference inputs"
					basicSetup={{
						lineNumbers: false,
						foldGutter: false,
						dropCursor: false,
						allowMultipleSelections: false,
						indentOnInput: false,
					}}
				/>
			</div>
			<div className="grid grid-cols-[2fr,1fr] gap-2 pt-2 pb-4 text-sm">
				<div className="flex flex-col gap-2 min-w-0">
					<Button
						variant="ghost"
						size="sm"
						className="w-fit h-7 px-2 mx-1"
						onClick={addInput}
					>
						<Plus className="h-4 w-4 mr-1" />
						New Input
					</Button>
					{data.inputs?.map((input) => (
						<EditableLabeledHandle
							key={input.id}
							nodeId={id}
							handleId={input.id}
							label={input.label}
							type="target"
							position={Position.Left}
							wrapperClassName="w-full"
							onLabelChange={updateInputName}
							onDelete={removeInput}
						/>
					))}
				</div>
				<div className="justify-self-end">
					<LabeledHandle
						id="output"
						title="Output"
						type="source"
						position={Position.Right}
					/>
				</div>
			</div>
		</BaseNode>
	);
}

const NodeHeaderDeleteAction = ({ id }: { id: string }) => {
	const deleteNode = useStore((state) => state.deleteNode);
	const handleClick = useCallback(() => {
		deleteNode(id);
	}, [id, deleteNode]);

	return (
		<NodeHeaderAction onClick={handleClick} variant="ghost" label="Delete node">
			<Trash />
		</NodeHeaderAction>
	);
};
