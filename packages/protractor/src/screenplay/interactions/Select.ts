import { Answerable, AnswersQuestions, Question } from '@serenity-js/core';
import { formatted } from '@serenity-js/core/lib/io';
import { Interaction, UsesAbilities } from '@serenity-js/core/lib/screenplay';
import { by, ElementFinder, protractor } from 'protractor';
import { promiseOf } from '../../promiseOf';
import { withAnswerOf } from '../withAnswerOf';

export class Select {

    static value(value: string | Answerable<string>) {
        return {
            from: (target: Question<ElementFinder> | ElementFinder): Interaction =>
                new SelectValue(value, target)
        };
    }

    static values(values: string[] | Question<Promise<string[]>>) {
        return {
            from: (target: Question<ElementFinder> | ElementFinder): Interaction =>
                new SelectValues(values, target)
        };
    }

    static option(value: string | Answerable<string>) {
        return {
            from: (target: Question<ElementFinder> | ElementFinder): Interaction =>
                new SelectOption(value, target)
        };
    }

    static options(values: string[] | Question<Promise<string[]>>) {
        return {
            from: (target: Question<ElementFinder> | ElementFinder): Interaction =>
                new SelectOptions(values, target)
        };
    }
}

/**
 * @package
 */
class SelectValue implements Interaction {

    constructor(
        private readonly value: string | Answerable<string>,
        private readonly target: Question<ElementFinder> | ElementFinder
    ) {
    }

    performAs(actor: UsesAbilities & AnswersQuestions): Promise<void> {
        return actor.answer(this.value)
            .then(value =>
                withAnswerOf(actor, this.target, element => element
                    .element(by.css(`option[value=${ value }]`)))
                    .click()
            );
    }

    toString () {
        return formatted `#actor selects value ${ this.value } in ${ this.target }`;
    }
}

/**
 * @package
 */
class SelectValues implements Interaction {

    constructor(
        private readonly values: string[] | Question<Promise<string[]>>,
        private readonly target: Question<ElementFinder> | ElementFinder
    ) {
    }

    performAs(actor: UsesAbilities & AnswersQuestions): Promise<void> {

        return actor.answer(this.values)
            .then(values => {

                const hasRequiredValue = (option: ElementFinder) => option.getAttribute('value').then(value => !!~values.indexOf(value)),
                    isAlreadySelected = (option: ElementFinder) => option.isSelected(),
                    ensureOnlyOneApplies = (list: boolean[]) => list.filter(_ => _ === true).length === 1,
                    select = (option: ElementFinder) => option.click();

                const optionsToClick = (option: ElementFinder) =>
                    protractor.promise.all(
                        [hasRequiredValue(option), isAlreadySelected(option)]
                    )
                    .then(ensureOnlyOneApplies);

                return promiseOf(withAnswerOf(actor, this.target, element => element.all(by.css('option'))
                    .filter(optionsToClick)
                    .each(select)));
            });
    }

    toString () {
        return formatted `#actor selects values ${ this.values } in ${ this.target }`;
    }
}

/**
 * @package
 */
class SelectOption implements Interaction {

    constructor(
        private readonly value: string | Answerable<string>,
        private readonly target: Question<ElementFinder> | ElementFinder
    ) {
    }

    performAs(actor: UsesAbilities & AnswersQuestions): Promise<void> {
        return actor.answer(this.value)
            .then(value => {
                return promiseOf(withAnswerOf(actor, this.target, element => element
                    .element(by.cssContainingText('option', value)))
                    .click());
            });
    }

    toString () {
        return formatted `#actor selects ${ this.value } in ${ this.target }`;
    }
}

/**
 * @package
 */
class SelectOptions implements Interaction {

    constructor(
        // todo: vararg
        private readonly values: string[] | Question<Promise<string[]>>,
        private readonly target: Question<ElementFinder> | ElementFinder
    ) {
    }

    performAs(actor: UsesAbilities & AnswersQuestions): Promise<void> {
        return actor.answer(this.values)
            .then(values => {

                const hasRequiredText = (option: ElementFinder) => option.getText().then(value => !!~values.indexOf(value)),
                    isAlreadySelected = (option: ElementFinder) => option.isSelected(),
                    ensureOnlyOneApplies = (list: boolean[]) => list.filter(_ => _ === true).length === 1,
                    select = (option: ElementFinder) => option.click();

                const optionsToClick = (option: ElementFinder) =>
                    protractor.promise.all([
                        hasRequiredText(option),
                        isAlreadySelected(option),
                    ])
                    .then(ensureOnlyOneApplies);

                return promiseOf(withAnswerOf(actor, this.target, element => element.all(by.css('option'))
                    .filter(optionsToClick)
                    .each(select)));
            });
    }

    toString () {
        return formatted `#actor selects ${ this.values } in ${ this.target }`;
    }
}
