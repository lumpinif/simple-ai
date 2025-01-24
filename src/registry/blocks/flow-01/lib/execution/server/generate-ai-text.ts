import type { Model, ToolResult } from "@/registry/blocks/flow-01/types/ai";
import type { GenerateTextNode } from "@/registry/blocks/flow-01/types/flow";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";

export function createAIClient(model: Model) {
	switch (model) {
		case "deepseek-chat":
			return createDeepSeek({
				baseURL: process.env.AI_GATEWAY_DEEPSEEK_URL,
			});
		case "llama-3.3-70b-versatile":
		case "llama-3.1-8b-instant":
			return createGroq({
				baseURL: process.env.AI_GATEWAY_GROQ_URL,
			});
		default:
			throw new Error(`Unsupported model: ${model}`);
	}
}

export function mapToolsForAI(
	tools: GenerateTextNode["data"]["dynamicHandles"]["tools"],
) {
	return Object.fromEntries(
		tools.map((toolToMap) => [
			toolToMap.name,
			{
				description: toolToMap.description,
				parameters: z.object({
					toolValue: z.string(),
				}),
				execute: async ({ toolValue }: { toolValue: string }) => toolValue,
			},
		]),
	);
}

export async function generateAIText({
	prompt,
	system,
	model,
	tools,
}: {
	prompt: string;
	system?: string;
	model: Model;
	tools: GenerateTextNode["data"]["dynamicHandles"]["tools"];
}) {
	const client = createAIClient(model);
	const mappedTools = mapToolsForAI(tools);

	const result = await generateText({
		model: client(model),
		system,
		prompt,
		...(tools.length > 0 && {
			tools: mappedTools,
			maxSteps: 1,
			toolChoice: "required",
		}),
	});

	let toolResults: ToolResult[] = [];
	if (tools.length > 0 && result.toolResults) {
		toolResults = result.toolResults.map((step) => {
			const originalTool = tools.find((tool) => tool.name === step.toolName);
			return {
				id: originalTool?.id || "",
				name: step.toolName,
				description: originalTool?.description || "",
				result: step.result,
			};
		});
	}

	const parsedResult: Record<string, string> = {
		result: result.text,
	};

	for (const toolResult of toolResults) {
		parsedResult[toolResult.id] = toolResult.result;
	}

	return {
		text: result.text,
		toolResults,
		totalTokens: result.usage?.totalTokens,
		parsedResult,
	};
}
