# Behavioral evaluation

These cases assess engineering judgment, not merely whether the plugin loads. They are a starting evaluation set, not evidence that model behavior has passed.

For each case in `cases.json`, construct a small isolated repository containing the stated context and meaningful behavior tests. Run the same task with and without PlanET using the same host, model, settings, and starting files. Give the agent the prompt and repository, not the `assess` criteria. Do not delegate or call paid models without authorization from the evaluation's operator.

Save the diff, transcript, executed checks, question count, and tool/model cost. Use the criteria to score observable behavior, and inspect a follow-up change to assess maintainability. Correctness and authorization violations are failures; shorter code is not automatically better. Repeat runs before drawing conclusions about reliability. Keep artifacts outside this repository.

`npm test` covers adapters and visual protocol invariants. It does not run this model evaluation or prove generated code is elegant.
