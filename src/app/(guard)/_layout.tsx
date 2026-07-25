import { Tabs } from 'expo-router';

import { roleTabIcon, useRoleTabScreenOptions } from '@/components/role-tabs';

export default function GuardLayout() {
  const { screenOptions, insets } = useRoleTabScreenOptions('guard');

  return (
    <Tabs screenOptions={screenOptions} safeAreaInsets={insets}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: roleTabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: roleTabIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: roleTabIcon(
            'shield-checkmark',
            'shield-checkmark-outline',
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: roleTabIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}
