# Engineering notes

Mazal Academy has two independent correctness problems: preserving a learner's edits across tabs, and making the assumptions behind each numerical lab explicit. The storage code gives stronger guarantees than a whole-document localStorage overwrite. The calculations remain simplified teaching models. The explanations below derive from the current code, not a recorded design history.

## Follow a notebook edit

[Academy.tsx](src/academy/Academy.tsx) stores lesson answers, notes, and the last lesson in a `CourseProgress` record. A note input calls `updateProgress` with a function that replaces one lesson's note while preserving the other fields. It does not submit a previously captured copy of the entire course as the authoritative replacement.

[useBrowserRecord.ts](src/academy/useBrowserRecord.ts) connects React through `useSyncExternalStore` to a shared session record. In [progress-session.ts](src/academy/progress-session.ts), `update` queues that change function, assigns a sequence ID, and publishes its optimistic result. The learner can see an edit while the storage status still says it is saving.

`flush` serializes pending work. It passes a batch of functions and the current reset epoch to `storage.update`. In [progress-storage.ts](src/academy/progress-storage.ts), a read/write IndexedDB transaction reads the latest academy document and applies those functions to the latest value for the selected record. It then increments the revision and writes the document. The promise resolves on transaction completion, not merely when the individual `put` request succeeds. That distinction prevents the interface from reporting success for a transaction that later aborts.

The session removes only the pending changes represented by the completed batch. It overlays newer pending changes on an incoming persisted snapshot. A refresh therefore need not erase text typed while an earlier save was in flight. The record also remains in the session client's map across component navigation, so an unsaved draft does not depend solely on a mounted input.

## Worked example across two tabs

Assume epoch 3, revision 10, and a course with no answer for question zero. Tab A changes one lesson note to `Review bond discounting`. Tab B selects answer index 1 for question zero. Each tab supplies a function that updates its own field.

If A commits first, the persisted record becomes revision 11. B's transaction reads that revision and applies its answer change to it, producing revision 12 with both the note and the answer. Reversing the transaction order retains both changes too. This is why merging against the latest value inside the transaction matters. Merging two snapshots captured at revision 10 outside the transaction would still lose an edit.

This is not a collaborative text editor. If both tabs replace the same note, the last transaction's replacement wins. There is no character-level merge, shared cursor, or conflict explanation. The benefit is a small data model for independent field edits; the cost is a deliberate limit on same-field collaboration.

Reset needs a different mechanism. `reset` clears both course and practice-plan records in one transaction and increments the epoch as well as the revision. A queued change carrying epoch 3 cannot repopulate a record reset to epoch 4. `update` returns the reset snapshot without applying that stale change, and the session drops pending work from the previous epoch. A revision orders changes; an epoch distinguishes a new learning history from the one the user erased.

## Notifications do not carry truth

BroadcastChannel, a localStorage notification token, and focus or visibility changes tell other tabs to refresh. IndexedDB remains the authority. Missing a notification may delay what another tab displays, but the next read obtains the persisted record. A malformed notification cannot directly replace course content.

A failed save leaves the queued functions and optimistic value available for retry. The session reports an error and warns before unloading when changes remain pending. Browser storage is still local storage: closing the process with unsaved changes can lose them, and clearing site data removes committed progress. The [storage tests](src/academy-storage.test.ts) and [UI tests](src/academy-progress-ui.test.ts) exercise cross-tab changes, reset handling, migration, and failed-save recovery. They do not establish cross-device durability.

## Calculation assumptions are part of the interface

[learning.ts](shared/learning.ts) keeps numerical functions independent of React. It rejects non-finite inputs and unsupported horizons. `compoundInvestment` converts an effective annual return into a monthly rate with `(1 + annualReturn / 100) ** (1 / 12) - 1`. Each month applies growth and then adds the contribution. That ordering means contributions arrive at the end of the month.

With a synthetic starting amount of 1,000, a monthly contribution of 100, a zero return, and one year, the result is 2,200. There is no compounding gain, so balance and total contributions agree. A nonzero return would give earlier contributions more growth periods than later ones.

The fee model multiplies annual growth by the amount remaining after the fee. At a 10% return and a 2% fee, the annual factor is `1.10 * 0.98 = 1.078`; a starting 1,000 becomes 1,078 for one modeled year. Subtracting percentage points would produce 1,080 and would describe a different model. The [calculation tests](shared/learning.test.ts) provide examples and boundary cases. The output does not include tax rules, changing market returns, or a prediction of future performance.

## Next experiment

Extend the storage checks with a deterministic interruption schedule around transaction completion and notification delivery. Run 100 ordered interleavings of distinct-field edits, reset, failed writes, and reopen. Success means no committed independent edit disappears, no pre-reset edit reappears, and the interface never says `saved` before transaction completion. Separately decide whether same-note conflicts warrant a warning or text merging. Adding a server would require authenticated ownership, a sync protocol, and conflict rules; transmitting browser snapshots alone would recreate the lost-update problem on another machine.

The [README](README.md#validation) preserves the recorded test and build results. No tests were rerun for this documentation change.
