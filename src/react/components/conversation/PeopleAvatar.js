/*
 * @agents Avatar of a conversation participant (group chat look): the person's photo (people_media,
 * cached per person for the whole app) or their initials; the name goes right below.
 */
import React, {useEffect, useState} from 'react';
import {Image, Text, View} from 'react-native';
import {api} from '@controleonline/ui-common/src/api';
import {fileIdOf, fileSource} from './fileApi';
import {toItems} from './requestApi';

const {initialsOf} = require('./formatText');

const photoCache = new Map();

const photoOf = peopleId => {
  if (!photoCache.has(peopleId)) {
    photoCache.set(
      peopleId,
      api
        .fetch('/people_media', {params: {people: peopleId, itemsPerPage: 1, 'order[id]': 'DESC'}})
        .then(res => {
          const fileId = fileIdOf(toItems(res)[0]?.file);
          return fileId ? fileSource(fileId) : null;
        })
        .catch(() => null),
    );
  }
  return photoCache.get(peopleId);
};

export default function PeopleAvatar({peopleId, name, palette, size = 34}) {
  const [source, setSource] = useState(null);
  useEffect(() => {
    let alive = true;
    if (peopleId) photoOf(peopleId).then(s => alive && setSource(s));
    return () => {
      alive = false;
    };
  }, [peopleId]);

  return (
    <View style={{width: 56, alignItems: 'center'}}>
      {source ? (
        <Image source={source} style={{width: size, height: size, borderRadius: size / 2}} />
      ) : (
        <View style={{width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.chipActive}}>
          <Text style={{color: palette.chipActiveText, fontWeight: '700', fontSize: 12}}>{initialsOf(name)}</Text>
        </View>
      )}
      <Text numberOfLines={2} style={{color: palette.muted, fontSize: 10, textAlign: 'center', marginTop: 2}}>
        {name}
      </Text>
    </View>
  );
}
