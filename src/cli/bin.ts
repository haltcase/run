#!/usr/bin/env node

import { createHandler } from "./handler.js";
import { main } from "./main.js";

const handler = createHandler();

void main({
	handler
});
