import assert from 'node:assert/strict'
import test from 'node:test'

import {
    createDroneWeaponAction,
    getDroneItems,
    getPlatformItems,
    getWeaponAmmoText,
    isSupportedActorType,
    openNativeEmbeddedItem,
    rollNativeEmbeddedWeapon
} from '../scripts/drone-support.js'

const i18n = key => ({
    'tokenActionHud.swnr.actionType.weapon': 'Weapon',
    'tokenActionHud.swnr.info.damage': 'Damage',
    'tokenActionHud.swnr.info.ammo': 'Ammo',
    'tokenActionHud.swnr.info.hit': 'Hit'
})[key] ?? key

const weapon = (id, name, { type = 'weapon', damage = '1d8', ammo } = {}) => ({
    id,
    name,
    type,
    img: `${id}.webp`,
    system: { damage, ...(ammo && { ammo }) }
})

test('native drone and vehicle actor types are routed as platform-capable actors', () => {
    assert.equal(isSupportedActorType('drone'), true)
    assert.equal(isSupportedActorType('vehicle'), true)
    assert.equal(isSupportedActorType('character'), true)
    assert.equal(isSupportedActorType('npc'), true)
    assert.equal(isSupportedActorType('drone-by-name'), false)
})

test('drone weapons include ordinary and ship weapons but exclude unrelated items', () => {
    const actor = {
        items: new Map([
            ['b', weapon('b', 'B Weapon')],
            ['a', weapon('a', 'A Ship Weapon', { type: 'shipWeapon' })],
            ['c', { id: 'c', name: 'Cargo', type: 'item', system: {} }]
        ])
    }

    assert.deepEqual(getDroneItems(actor, 'weapons').map(([id]) => id), ['a', 'b'])
})

test('drone weapon actions retain native item ids and show damage plus current ammunition', () => {
    const item = weapon('drone-weapon', 'Drone Rifle', {
        ammo: { type: 'standard', value: 4, max: 30 }
    })
    const action = createDroneWeaponAction({
        itemId: item.id,
        item,
        delimiter: '|',
        i18n,
        getImage: document => document.img
    })

    assert.equal(action.encodedValue, 'weapon|drone-weapon')
    assert.equal(action.img, 'drone-weapon.webp')
    assert.deepEqual(action.info1, { text: '1d8', title: 'Damage' })
    assert.deepEqual(action.info2, { text: '4/30', title: 'Ammo', class: '' })
})

test('empty weapons remain listed and clearly report zero ammunition', () => {
    const item = weapon('empty', 'Empty Rifle', { ammo: { type: 'standard', value: 0, max: 30 } })
    assert.equal(getWeaponAmmoText(item), '0/30')
    const action = createDroneWeaponAction({ itemId: item.id, item, delimiter: '|', i18n, getImage: () => '' })
    assert.equal(action.info2.text, '0/30')
    assert.equal(action.info2.class, 'inactive')
})

test('cargo, fittings, and defences are independently discovered from embedded items', () => {
    const actor = {
        items: [
            { id: 'cargo', name: 'Cargo', type: 'item', system: {} },
            { id: 'fit', name: 'Fitting', type: 'shipFitting', system: {} },
            { id: 'def', name: 'Defence', type: 'shipDefense', system: {} }
        ]
    }

    assert.deepEqual(getDroneItems(actor, 'cargo').map(([id]) => id), ['cargo'])
    assert.deepEqual(getDroneItems(actor, 'fittings').map(([id]) => id), ['fit'])
    assert.deepEqual(getDroneItems(actor, 'defences').map(([id]) => id), ['def'])
})

test('vehicle embedded items are grouped using the same native platform item types', () => {
    const actor = {
        type: 'vehicle',
        items: [
            weapon('vehicle-weapon', 'Mounted Gun'),
            weapon('vehicle-ship-weapon', 'Heavy Mount', { type: 'shipWeapon' }),
            { id: 'cargo', name: 'Vehicle Cargo', type: 'item', system: {} },
            { id: 'fit', name: 'Vehicle Fitting', type: 'shipFitting', system: {} },
            { id: 'def', name: 'Vehicle Defence', type: 'shipDefense', system: {} }
        ]
    }

    assert.deepEqual(getPlatformItems(actor, 'weapons').map(([id]) => id), ['vehicle-ship-weapon', 'vehicle-weapon'])
    assert.deepEqual(getPlatformItems(actor, 'cargo').map(([id]) => id), ['cargo'])
    assert.deepEqual(getPlatformItems(actor, 'fittings').map(([id]) => id), ['fit'])
    assert.deepEqual(getPlatformItems(actor, 'defences').map(([id]) => id), ['def'])
})

test('vehicle weapon actions use the embedded item native roll path', async () => {
    let rolled = 0
    const item = { roll: async () => { rolled += 1 } }

    await rollNativeEmbeddedWeapon(item)

    assert.equal(rolled, 1)
})

test('passive vehicle actions open the embedded item sheet', () => {
    let rendered = 0
    const item = { sheet: { render: force => { if (force) rendered += 1 } } }

    openNativeEmbeddedItem(item)

    assert.equal(rendered, 1)
})
